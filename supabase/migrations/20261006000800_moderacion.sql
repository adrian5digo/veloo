-- Veloo · 08 moderación y reportes (A1, A4, R1, E4).

-- Motivos fijos de rechazo: el texto es exactamente lo que leerá la creadora (E4).
create table public.motivos_rechazo (
  codigo text primary key check (codigo ~ '^[a-z_]+$'),
  texto_para_creadora text not null,
  activo boolean not null default true
);

alter table public.motivos_rechazo enable row level security;
create policy "staff ve motivos" on public.motivos_rechazo for select to authenticated using ((select public.es_staff()));

create type public.decision_moderacion as enum ('aprobado', 'rechazado');

create table public.decisiones_moderacion (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.sets (id) on delete cascade,
  staff_id uuid not null references public.staff (id),
  decision public.decision_moderacion not null,
  motivo_codigo text references public.motivos_rechazo (codigo),
  nota_interna text,
  creada_en timestamptz not null default now(),
  check ((decision = 'rechazado') = (motivo_codigo is not null))
);

create index decisiones_set_idx on public.decisiones_moderacion (set_id, creada_en desc);

alter table public.decisiones_moderacion enable row level security;
create policy "staff ve decisiones" on public.decisiones_moderacion
  for select to authenticated using ((select public.es_staff()));

-- Servidor (panel A1): aprueba o rechaza un set en moderación.
-- "Aprobar" se bloquea si la creadora no está verificada o si alguien aparece sin firmar.
create function public.moderar_set(p_set uuid, p_staff uuid, p_decision public.decision_moderacion, p_motivo text default null, p_nota text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.sets;
  v_texto text;
begin
  select * into s from public.sets where id = p_set for update;
  if not found or s.estado <> 'moderacion' then
    raise exception 'set_no_en_moderacion';
  end if;

  if p_decision = 'aprobado' then
    if not exists (select 1 from public.creadoras where id = s.creadora_id and verificacion = 'aprobada') then
      raise exception 'creadora_no_verificada';
    end if;
    if exists (select 1 from public.personas_set where set_id = p_set and estado_firma <> 'firmada') then
      raise exception 'faltan_firmas';
    end if;
    update public.sets set estado = 'publicado', publicado_en = coalesce(publicado_en, now()) where id = p_set;
  else
    select texto_para_creadora into v_texto from public.motivos_rechazo where codigo = p_motivo and activo;
    if v_texto is null then
      raise exception 'motivo_invalido';
    end if;
    update public.sets set estado = 'rechazado', motivo_rechazo = v_texto where id = p_set;
  end if;

  insert into public.decisiones_moderacion (set_id, staff_id, decision, motivo_codigo, nota_interna)
  values (p_set, p_staff, p_decision, case when p_decision = 'rechazado' then p_motivo end, p_nota);
end $$;

-- ───────────────────────── reportes (R1, A4) ─────────────────────────
-- Se pueden mandar sin cuenta (el servidor los inserta y limita por IP).
-- "Aparezco sin haberlo aceptado" y "Puede ser menor de edad" son urgentes: ocultan el set ya.

create type public.motivo_reporte as enum ('sin_consentimiento', 'posible_menor', 'contenido_prohibido', 'spam', 'otro');
create type public.estado_reporte as enum ('abierto', 'sin_falta', 'set_quitado');

create sequence public.folio_reporte_seq;

create table public.reportes (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique default 'VR-' || lpad(nextval('public.folio_reporte_seq')::text, 6, '0'),
  set_id uuid references public.sets (id) on delete set null,
  creadora_id uuid references public.creadoras (id) on delete set null,
  motivo public.motivo_reporte not null,
  urgente boolean not null default false,
  detalle text check (char_length(detalle) <= 1000),
  correo_contacto text check (correo_contacto is null or public.correo_valido(correo_contacto)),
  ip_hash text,
  estado public.estado_reporte not null default 'abierto',
  resuelto_por uuid references public.staff (id),
  resuelto_en timestamptz,
  creado_en timestamptz not null default now()
);

create index reportes_abiertos_idx on public.reportes (urgente desc, creado_en) where estado = 'abierto';

create function public.procesar_reporte() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.urgente := new.motivo in ('sin_consentimiento', 'posible_menor');
  if new.set_id is not null then
    select creadora_id into new.creadora_id from public.sets where id = new.set_id;
    if new.urgente then
      update public.sets
      set estado = 'oculto', oculto_motivo = 'reporte ' || new.folio
      where id = new.set_id and estado in ('publicado', 'moderacion');
    end if;
  end if;
  return new;
end $$;

create trigger reportes_procesar before insert on public.reportes
  for each row execute function public.procesar_reporte();

alter table public.reportes enable row level security;
create policy "staff ve reportes" on public.reportes
  for select to authenticated using ((select public.es_staff()));

-- Servidor (panel A4): "Sin falta" restaura el set si el reporte lo había ocultado; "Quitar set" lo deja oculto.
create function public.resolver_reporte(p_reporte uuid, p_staff uuid, p_estado public.estado_reporte) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.reportes;
begin
  if p_estado = 'abierto' then
    raise exception 'estado_invalido';
  end if;
  update public.reportes set estado = p_estado, resuelto_por = p_staff, resuelto_en = now()
  where id = p_reporte and estado = 'abierto'
  returning * into r;
  if not found then
    raise exception 'reporte_no_abierto';
  end if;

  if r.set_id is not null then
    if p_estado = 'set_quitado' then
      update public.sets set estado = 'oculto', oculto_motivo = 'reporte ' || r.folio
      where id = r.set_id and estado in ('publicado', 'moderacion', 'oculto');
    elsif not exists (
      select 1 from public.reportes where set_id = r.set_id and urgente and estado = 'abierto'
    ) then
      -- Sin otros reportes urgentes abiertos: vuelve a publicarse si lo había ocultado un reporte.
      update public.sets set estado = 'publicado', oculto_motivo = null
      where id = r.set_id and estado = 'oculto' and oculto_motivo like 'reporte %';
    end if;
  end if;
end $$;

revoke execute on function public.moderar_set(uuid, uuid, public.decision_moderacion, text, text) from public, anon, authenticated;
revoke execute on function public.resolver_reporte(uuid, uuid, public.estado_reporte) from public, anon, authenticated;

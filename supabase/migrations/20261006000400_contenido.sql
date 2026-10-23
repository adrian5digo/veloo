-- Veloo · 04 contenido: sets, medios (fotos y videos) y consentimiento de otras personas.
--
-- Ciclo de un set:
--   borrador ──enviar_a_moderacion()──▶ moderacion ──moderar_set()──▶ publicado
--       ▲                                   │                            │
--       └────────── rechazado ◀─────────────┘                            ├─ retirar_set() ──▶ retirado (lo quitó la creadora)
--                                                                        └─ reporte urgente / firma retirada ──▶ oculto
-- La creadora nunca cambia el estado directo: solo por estas funciones.

create type public.estado_set as enum ('borrador', 'moderacion', 'publicado', 'rechazado', 'oculto', 'retirado');
create type public.tipo_medio as enum ('foto', 'video');
create type public.estado_medio as enum ('subiendo', 'procesando', 'lista', 'error');
create type public.vista_previa_video as enum ('clip', 'portada');
create type public.estado_firma as enum ('pendiente', 'enviada', 'firmada', 'rechazada', 'retirada');

-- ───────────────────────── sets ─────────────────────────

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 60),
  -- 0 = gratis (S3 pestaña "Gratis"). Máximo $99,999.
  precio_centavos integer not null check (precio_centavos between 0 and 9999900 and precio_centavos % 100 = 0),
  estado public.estado_set not null default 'borrador',
  -- C4b: "¿Aparece otra persona?" y la casilla de declaración obligatoria.
  con_otras_personas boolean not null default false,
  declaracion_en timestamptz,
  portada_id uuid,
  motivo_rechazo text,
  oculto_motivo text,
  enviado_en timestamptz,
  publicado_en timestamptz,
  retirado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index sets_creadora_idx on public.sets (creadora_id, creado_en desc);
create index sets_publicados_idx on public.sets (creadora_id, publicado_en desc) where estado = 'publicado';
create index sets_moderacion_idx on public.sets (enviado_en) where estado = 'moderacion';

create trigger sets_actualizado before update on public.sets
  for each row execute function public.tocar_actualizado();

-- ───────────────────────── medios ─────────────────────────
-- Archivos en storage (los escribe solo el servidor):
--   subidas/{creadora}/{id}             lo que subió, tal cual (se borra al procesar: trae EXIF)
--   privado/{creadora}/{id}/...         original limpio, vista nítida, HLS del video
--   velos/{id}/mini.webp|grande.webp    público; para video, también el clip con velo

create table public.medios (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  set_id uuid references public.sets (id) on delete set null,
  tipo public.tipo_medio not null default 'foto',
  estado public.estado_medio not null default 'subiendo',
  ancho integer check (ancho > 0),
  alto integer check (alto > 0),
  bytes bigint check (bytes > 0),
  -- Solo video: hasta 15 min (C4v).
  duracion_seg numeric(7, 2) check (duracion_seg > 0 and duracion_seg <= 900),
  vista_previa public.vista_previa_video,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  check (tipo = 'video' or (duracion_seg is null and vista_previa is null))
);

create index medios_set_idx on public.medios (set_id, orden);
create index medios_creadora_idx on public.medios (creadora_id, creado_en desc);

alter table public.sets
  add constraint sets_portada_fk foreign key (portada_id) references public.medios (id) on delete set null;

-- ───────────────────────── consentimiento (C4b) ─────────────────────────
-- Cada persona que aparece firma por set: INE + selfie + firma, por un link con token.
-- La creadora solo ve el estado de la firma (vista personas_de_mis_sets), nunca los datos de la persona.

create table public.personas_set (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.sets (id) on delete cascade,
  telefono text not null check (telefono ~ '^\+?[0-9]{10,15}$'),
  estado_firma public.estado_firma not null default 'pendiente',
  token_hash text unique,
  -- Lo llena el formulario de la persona (bucket "identidad").
  nombre_legal text,
  fecha_nacimiento date,
  ine_frente_path text,
  ine_reverso_path text,
  selfie_path text,
  firma_path text,
  coincidencia_facial numeric(5, 2) check (coincidencia_facial between 0 and 100),
  prueba_vida boolean,
  enviado_en timestamptz,
  firmado_en timestamptz,
  retirado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index personas_set_idx on public.personas_set (set_id);

-- Si alguien retira su consentimiento, el set se oculta de inmediato.
create function public.ocultar_por_consentimiento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado_firma = 'retirada' and old.estado_firma is distinct from 'retirada' then
    new.retirado_en := now();
    update public.sets
    set estado = 'oculto', oculto_motivo = 'consentimiento_retirado'
    where id = new.set_id and estado in ('publicado', 'moderacion');
  end if;
  return new;
end $$;

create trigger personas_set_retiro before update of estado_firma on public.personas_set
  for each row execute function public.ocultar_por_consentimiento();

-- ───────────────────────── RLS ─────────────────────────

alter table public.sets enable row level security;
alter table public.medios enable row level security;
alter table public.personas_set enable row level security;

create policy "creadora ve sus sets" on public.sets
  for select to authenticated using (creadora_id = (select auth.uid()));

create policy "sets publicados son públicos" on public.sets
  for select to anon, authenticated using (estado = 'publicado');

create policy "staff ve sets" on public.sets
  for select to authenticated using ((select public.es_staff()));

create policy "creadora crea borradores" on public.sets
  for insert to authenticated with check (creadora_id = (select auth.uid()) and estado = 'borrador');

create policy "creadora edita borradores y rechazados" on public.sets
  for update to authenticated
  using (creadora_id = (select auth.uid()) and estado in ('borrador', 'rechazado'))
  with check (creadora_id = (select auth.uid()));

create policy "creadora borra borradores" on public.sets
  for delete to authenticated using (creadora_id = (select auth.uid()) and estado = 'borrador');

-- El estado no está en los grants: solo cambia por las funciones de abajo.
revoke insert, update on public.sets from anon, authenticated;
grant insert (creadora_id, titulo, precio_centavos, portada_id, con_otras_personas) on public.sets to authenticated;
grant update (titulo, precio_centavos, portada_id, con_otras_personas) on public.sets to authenticated;

create policy "creadora ve sus medios" on public.medios
  for select to authenticated using (creadora_id = (select auth.uid()));

create policy "medios de sets publicados son públicos" on public.medios
  for select to anon, authenticated
  using (estado = 'lista' and exists (select 1 from public.sets s where s.id = set_id and s.estado = 'publicado'));

create policy "staff ve medios" on public.medios
  for select to authenticated using ((select public.es_staff()));

create policy "creadora acomoda sus medios" on public.medios
  for update to authenticated
  using (creadora_id = (select auth.uid()))
  with check (
    creadora_id = (select auth.uid())
    and (set_id is null or exists (
      select 1 from public.sets s
      where s.id = set_id and s.creadora_id = (select auth.uid()) and s.estado in ('borrador', 'rechazado')
    ))
  );

-- Medios los crea y borra el servidor (necesita tocar storage).
revoke insert, update, delete on public.medios from anon, authenticated;
grant update (set_id, orden) on public.medios to authenticated;

create policy "staff ve personas" on public.personas_set
  for select to authenticated using ((select public.es_staff()));

-- C4b: lo que la creadora ve de cada persona.
create view public.personas_de_mis_sets as
  select p.id, p.set_id, '••• ' || right(p.telefono, 4) as telefono, p.estado_firma, p.enviado_en, p.firmado_en
  from public.personas_set p
  join public.sets s on s.id = p.set_id
  where s.creadora_id = (select auth.uid());

revoke all on public.personas_de_mis_sets from anon;
grant select on public.personas_de_mis_sets to authenticated;

-- ───────────────────────── transiciones de la creadora ─────────────────────────

create function public.enviar_a_moderacion(p_set uuid, p_declaro boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.sets;
begin
  select * into s from public.sets where id = p_set for update;
  if not found or s.creadora_id is distinct from (select auth.uid()) then
    raise exception 'set_no_encontrado';
  end if;
  if s.estado not in ('borrador', 'rechazado') then
    raise exception 'set_no_editable';
  end if;
  if not coalesce(p_declaro, false) then
    raise exception 'falta_declaracion';
  end if;
  if not exists (select 1 from public.medios where set_id = p_set) then
    raise exception 'set_sin_medios';
  end if;
  if exists (select 1 from public.medios where set_id = p_set and estado <> 'lista') then
    raise exception 'medios_pendientes';
  end if;
  if s.con_otras_personas and (
    not exists (select 1 from public.personas_set where set_id = p_set)
    or exists (select 1 from public.personas_set where set_id = p_set and estado_firma <> 'firmada')
  ) then
    raise exception 'faltan_firmas';
  end if;

  update public.sets
  set estado = 'moderacion', declaracion_en = now(), enviado_en = now(), motivo_rechazo = null,
      portada_id = coalesce(portada_id, (select id from public.medios where set_id = p_set order by orden limit 1))
  where id = p_set;
end $$;

-- E5: la creadora quita un set. Las compras hechas se conservan.
create function public.retirar_set(p_set uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.sets
  set estado = 'retirado', retirado_en = now()
  where id = p_set and creadora_id = (select auth.uid()) and estado in ('moderacion', 'publicado', 'oculto');
  if not found then
    raise exception 'set_no_encontrado';
  end if;
end $$;

revoke execute on function public.enviar_a_moderacion(uuid, boolean) from public, anon;
revoke execute on function public.retirar_set(uuid) from public, anon;
grant execute on function public.enviar_a_moderacion(uuid, boolean) to authenticated;
grant execute on function public.retirar_set(uuid) to authenticated;

-- Veloo · 06 dinero: saldo, retiros, CLABE y CFDI (C6, C7, C10, C11).
--
-- El saldo no es un número que se sobrescribe: es la suma de movimientos_saldo.
--   venta        +neto   disponible 7 días después del pago (retención por contracargos)
--   contracargo  −neto   inmediato
--   retiro       −monto  inmediato al solicitar
--   retiro_revertido +monto si el SPEI falla
-- Así cualquier saldo se puede reconstruir y auditar.

create table public.bancos (
  codigo text primary key check (codigo ~ '^[0-9]{3}$'),
  nombre text not null
);

-- Catálogo parcial; completar con el catálogo de participantes SPEI de Banxico.
insert into public.bancos (codigo, nombre) values
  ('002', 'Banamex'), ('012', 'BBVA México'), ('014', 'Santander'), ('021', 'HSBC'), ('030', 'Bajío'),
  ('036', 'Inbursa'), ('044', 'Scotiabank'), ('058', 'Banregio'), ('062', 'Afirme'), ('072', 'Banorte'),
  ('127', 'Banco Azteca'), ('137', 'BanCoppel'), ('638', 'Nu México'), ('646', 'STP'), ('722', 'Mercado Pago');

alter table public.bancos enable row level security;
create policy "bancos son públicos" on public.bancos for select to anon, authenticated using (true);

-- ───────────────────────── CLABE (C10) ─────────────────────────
-- Cambiarla: se crea una nueva "por_confirmar", se confirma por correo y al activarla
-- se pausan los retiros 24 h. El titular sale de la INE (no editable).

create type public.estado_cuenta_bancaria as enum ('por_confirmar', 'activa', 'reemplazada');

create table public.cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  clabe text not null check (public.clabe_valida(clabe)),
  banco_codigo text generated always as (left(clabe, 3)) stored references public.bancos (codigo),
  titular text not null,
  estado public.estado_cuenta_bancaria not null default 'por_confirmar',
  token_confirmacion_hash text unique,
  confirmada_en timestamptz,
  retiros_pausados_hasta timestamptz,
  creada_en timestamptz not null default now()
);

create unique index cuentas_bancarias_una_activa on public.cuentas_bancarias (creadora_id) where estado = 'activa';

alter table public.cuentas_bancarias enable row level security;

-- Lo que la creadora ve: CLABE enmascarada.
create view public.mi_cuenta_bancaria as
  select cb.id, '•••• ' || right(cb.clabe, 4) as clabe, b.nombre as banco, cb.titular, cb.estado,
         cb.retiros_pausados_hasta, cb.creada_en
  from public.cuentas_bancarias cb
  join public.bancos b on b.codigo = cb.banco_codigo
  where cb.creadora_id = (select auth.uid()) and cb.estado in ('por_confirmar', 'activa');

-- ───────────────────────── retiros (C7) ─────────────────────────

create type public.estado_retiro as enum ('solicitado', 'en_proceso', 'pagado', 'fallido');

create table public.retiros (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete restrict,
  cuenta_id uuid not null references public.cuentas_bancarias (id),
  monto_centavos integer not null check (monto_centavos >= 20000),
  estado public.estado_retiro not null default 'solicitado',
  rastreo_spei text,
  motivo_fallo text,
  solicitado_en timestamptz not null default now(),
  pagado_en timestamptz,
  actualizado_en timestamptz not null default now()
);

create index retiros_creadora_idx on public.retiros (creadora_id, solicitado_en desc);

create trigger retiros_actualizado before update on public.retiros
  for each row execute function public.tocar_actualizado();

alter table public.retiros enable row level security;

create policy "creadora ve sus retiros" on public.retiros
  for select to authenticated using (creadora_id = (select auth.uid()));

-- ───────────────────────── movimientos ─────────────────────────

create type public.tipo_movimiento as enum ('venta', 'contracargo', 'retiro', 'retiro_revertido', 'ajuste');

create table public.movimientos_saldo (
  id bigint generated always as identity primary key,
  creadora_id uuid not null references public.creadoras (id) on delete restrict,
  tipo public.tipo_movimiento not null,
  monto_centavos integer not null check (monto_centavos <> 0),
  disponible_desde timestamptz not null default now(),
  orden_id uuid references public.ordenes (id),
  retiro_id uuid references public.retiros (id),
  nota text,
  creado_en timestamptz not null default now(),
  -- Una venta y a lo más un contracargo por orden; un movimiento por retiro y tipo.
  unique (orden_id, tipo),
  unique (retiro_id, tipo),
  check ((tipo in ('venta', 'contracargo')) = (orden_id is not null)),
  check ((tipo in ('retiro', 'retiro_revertido')) = (retiro_id is not null)),
  check (case tipo when 'venta' then monto_centavos > 0
                   when 'retiro_revertido' then monto_centavos > 0
                   when 'contracargo' then monto_centavos < 0
                   when 'retiro' then monto_centavos < 0
                   else true end)
);

create index movimientos_creadora_idx on public.movimientos_saldo (creadora_id, creado_en desc);

alter table public.movimientos_saldo enable row level security;

create policy "creadora ve sus movimientos" on public.movimientos_saldo
  for select to authenticated using (creadora_id = (select auth.uid()));

-- Sin security definer: desde el navegador, RLS limita la suma a los movimientos propios.
create function public.saldo_de(p_creadora uuid, out disponible_centavos bigint, out retenido_centavos bigint)
language sql stable set search_path = '' as $$
  select coalesce(sum(monto_centavos) filter (where disponible_desde <= now()), 0),
         coalesce(sum(monto_centavos) filter (where disponible_desde > now()), 0)
  from public.movimientos_saldo
  where creadora_id = p_creadora
$$;

create view public.mi_saldo as
  select s.disponible_centavos, s.retenido_centavos from public.saldo_de((select auth.uid())) s;

-- ───────────────────────── CFDI mensual de comisiones ─────────────────────────

create table public.cfdis (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete restrict,
  periodo date not null check (extract(day from periodo) = 1),
  comision_centavos integer not null check (comision_centavos >= 0),
  uuid_sat uuid unique,
  xml_path text,
  pdf_path text,
  emitido_en timestamptz,
  unique (creadora_id, periodo)
);

alter table public.cfdis enable row level security;

create policy "creadora ve sus cfdis" on public.cfdis
  for select to authenticated using (creadora_id = (select auth.uid()));

revoke all on public.mi_cuenta_bancaria, public.mi_saldo from anon;
grant select on public.mi_cuenta_bancaria, public.mi_saldo to authenticated;

-- ───────────────────────── funciones ─────────────────────────

-- C7: la creadora pide un retiro de su saldo disponible.
create function public.solicitar_retiro(p_monto_centavos integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_creadora uuid := (select auth.uid());
  v_cuenta public.cuentas_bancarias;
  v_disponible bigint;
  v_retiro uuid;
begin
  if v_creadora is null then
    raise exception 'sin_sesion';
  end if;
  -- Un retiro a la vez por creadora (evita gastar dos veces el mismo saldo).
  perform pg_advisory_xact_lock(hashtext('retiro:' || v_creadora::text));

  if not exists (select 1 from public.creadoras where id = v_creadora and verificacion = 'aprobada') then
    raise exception 'creadora_no_verificada';
  end if;
  if p_monto_centavos is null or p_monto_centavos < 20000 then
    raise exception 'retiro_minimo' using hint = 'El retiro mínimo es de $200';
  end if;

  select * into v_cuenta from public.cuentas_bancarias where creadora_id = v_creadora and estado = 'activa';
  if not found then
    raise exception 'sin_cuenta_bancaria';
  end if;
  if v_cuenta.retiros_pausados_hasta > now() then
    raise exception 'retiros_pausados' using hint = 'Cambiaste tu CLABE hace menos de 24 h';
  end if;

  select disponible_centavos into v_disponible from public.saldo_de(v_creadora);
  if v_disponible < p_monto_centavos then
    raise exception 'saldo_insuficiente';
  end if;

  insert into public.retiros (creadora_id, cuenta_id, monto_centavos)
  values (v_creadora, v_cuenta.id, p_monto_centavos)
  returning id into v_retiro;

  insert into public.movimientos_saldo (creadora_id, tipo, monto_centavos, retiro_id)
  values (v_creadora, 'retiro', -p_monto_centavos, v_retiro);

  return v_retiro;
end $$;

-- Servidor: el SPEI del retiro falló; el dinero regresa al saldo.
create function public.revertir_retiro(p_retiro uuid, p_motivo text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.retiros;
begin
  update public.retiros set estado = 'fallido', motivo_fallo = p_motivo
  where id = p_retiro and estado in ('solicitado', 'en_proceso')
  returning * into r;
  if not found then
    raise exception 'retiro_no_reversible';
  end if;
  insert into public.movimientos_saldo (creadora_id, tipo, monto_centavos, retiro_id, nota)
  values (r.creadora_id, 'retiro_revertido', r.monto_centavos, r.id, p_motivo);
end $$;

-- Servidor: activa una CLABE confirmada por correo y pausa retiros 24 h.
create function public.activar_cuenta_bancaria(p_cuenta uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_creadora uuid;
begin
  select creadora_id into v_creadora from public.cuentas_bancarias where id = p_cuenta and estado = 'por_confirmar';
  if not found then
    raise exception 'cuenta_no_encontrada';
  end if;
  update public.cuentas_bancarias set estado = 'reemplazada'
  where creadora_id = v_creadora and estado = 'activa';
  update public.cuentas_bancarias
  set estado = 'activa', confirmada_en = now(), token_confirmacion_hash = null,
      retiros_pausados_hasta = case
        when exists (select 1 from public.cuentas_bancarias where creadora_id = v_creadora and estado = 'reemplazada')
        then now() + interval '24 hours'
      end
  where id = p_cuenta;
end $$;

-- Servidor (webhook): la orden se pagó. Idempotente.
create function public.confirmar_pago(p_orden uuid, p_token_hash text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  o public.ordenes;
begin
  select * into o from public.ordenes where id = p_orden for update;
  if not found then
    raise exception 'orden_no_encontrada';
  end if;
  if o.estado = 'pagada' then
    return false;
  end if;
  if o.estado not in ('pendiente', 'vencida') then
    raise exception 'orden_no_pagable';
  end if;

  update public.ordenes set estado = 'pagada', pagada_en = now() where id = p_orden;

  insert into public.movimientos_saldo (creadora_id, tipo, monto_centavos, disponible_desde, orden_id)
  values (o.creadora_id, 'venta', o.neto_centavos, now() + interval '7 days', o.id);

  insert into public.accesos (orden_id, set_id, correo, token_hash)
  values (o.id, o.set_id, o.correo, p_token_hash);

  return true;
end $$;

-- Servidor (webhook): contracargo. Descuenta el neto y revoca el acceso.
create function public.registrar_contracargo(p_orden uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.ordenes;
begin
  update public.ordenes set estado = 'contracargo'
  where id = p_orden and estado = 'pagada'
  returning * into o;
  if not found then
    raise exception 'orden_no_pagada';
  end if;
  insert into public.movimientos_saldo (creadora_id, tipo, monto_centavos, orden_id)
  values (o.creadora_id, 'contracargo', -o.neto_centavos, o.id);
  update public.accesos set revocado_en = now() where orden_id = o.id;
end $$;

-- Servidor (cron): fichas OXXO y CLABEs SPEI vencidas.
create function public.vencer_ordenes() returns integer
language sql security definer set search_path = '' as $$
  with v as (
    update public.ordenes set estado = 'vencida'
    where estado = 'pendiente' and vence_en < now()
    returning 1
  )
  select count(*)::integer from v
$$;

revoke execute on function public.solicitar_retiro(integer) from public, anon;
grant execute on function public.solicitar_retiro(integer) to authenticated;

revoke execute on function public.revertir_retiro(uuid, text) from public, anon, authenticated;
revoke execute on function public.activar_cuenta_bancaria(uuid) from public, anon, authenticated;
revoke execute on function public.confirmar_pago(uuid, text) from public, anon, authenticated;
revoke execute on function public.registrar_contracargo(uuid) from public, anon, authenticated;
revoke execute on function public.vencer_ordenes() from public, anon, authenticated;
revoke execute on function public.saldo_de(uuid) from public, anon;
grant execute on function public.saldo_de(uuid) to authenticated;

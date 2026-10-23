-- Veloo · 16 tokens: el fan compra paquetes con Stripe y desbloquea sets con su saldo.
--
--   compras_tokens ──(webhook de Stripe)──▶ acreditar_tokens() ──▶ movimientos_tokens (+)
--   desbloquear_con_tokens() ──▶ orden pagada (metodo 'tokens') + acceso + venta de la creadora
--                            └─▶ movimientos_tokens (−)
--
-- 1 token = $1 MXN. Un set de $149 cuesta 149 tokens. Los tokens solo sirven dentro de Veloo:
-- no se transfieren entre fans ni se cambian por dinero. La venta de la creadora sigue igual
-- que con cualquier otro pago (neto después del 20%, retenido 7 días).

create type public.estado_compra_tokens as enum ('pendiente', 'pagada', 'fallida', 'reembolsada');
create type public.tipo_movimiento_tokens as enum ('compra', 'desbloqueo', 'reembolso', 'ajuste');

create table public.compras_tokens (
  id uuid primary key default gen_random_uuid(),
  folio bigint generated always as identity unique,
  fan_id uuid not null references public.fans (id) on delete restrict,
  tokens integer not null check (tokens > 0),
  precio_centavos integer not null check (precio_centavos > 0),
  estado public.estado_compra_tokens not null default 'pendiente',
  procesador text not null,
  procesador_ref text,
  pagada_en timestamptz,
  creada_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (procesador, procesador_ref),
  check (estado <> 'pagada' or pagada_en is not null)
);

create index compras_tokens_fan_idx on public.compras_tokens (fan_id, creada_en desc);

create trigger compras_tokens_actualizado before update on public.compras_tokens
  for each row execute function public.tocar_actualizado();

-- El saldo es la suma de movimientos; nunca se guarda aparte.
create table public.movimientos_tokens (
  id bigint generated always as identity primary key,
  fan_id uuid not null references public.fans (id) on delete restrict,
  tipo public.tipo_movimiento_tokens not null,
  tokens integer not null check (tokens <> 0),
  compra_id uuid references public.compras_tokens (id),
  orden_id uuid unique references public.ordenes (id),
  creado_en timestamptz not null default now(),
  unique (compra_id, tipo),
  check (tipo <> 'compra' or (compra_id is not null and tokens > 0)),
  check (tipo <> 'desbloqueo' or (orden_id is not null and tokens < 0))
);

create index movimientos_tokens_fan_idx on public.movimientos_tokens (fan_id, creado_en desc);

alter table public.compras_tokens enable row level security;
alter table public.movimientos_tokens enable row level security;

create policy "fan ve sus compras de tokens" on public.compras_tokens
  for select to authenticated using (fan_id = (select auth.uid()));
create policy "fan ve sus movimientos de tokens" on public.movimientos_tokens
  for select to authenticated using (fan_id = (select auth.uid()));
create policy "staff ve compras de tokens" on public.compras_tokens
  for select to authenticated using ((select public.es_staff()));

revoke insert, update, delete on public.compras_tokens, public.movimientos_tokens from anon, authenticated;

-- Saldo del fan con sesión.
create view public.mi_saldo_tokens with (security_invoker = true) as
  select coalesce(sum(tokens), 0)::integer as tokens
  from public.movimientos_tokens
  where fan_id = (select auth.uid());

revoke all on public.mi_saldo_tokens from anon;
grant select on public.mi_saldo_tokens to authenticated;

-- Servidor (webhook de Stripe): el pago de un paquete se confirmó. Idempotente.
create function public.acreditar_tokens(p_compra uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  c public.compras_tokens;
begin
  select * into c from public.compras_tokens where id = p_compra for update;
  if not found then
    raise exception 'compra_no_encontrada';
  end if;
  if c.estado = 'pagada' then
    return false;
  end if;
  if c.estado not in ('pendiente', 'fallida') then
    raise exception 'compra_no_acreditable';
  end if;

  update public.compras_tokens set estado = 'pagada', pagada_en = now() where id = p_compra;
  insert into public.movimientos_tokens (fan_id, tipo, tokens, compra_id) values (c.fan_id, 'compra', c.tokens, c.id);
  return true;
end $$;

-- Fan con sesión: desbloquea un set con su saldo. Si ya lo tenía, devuelve esa orden sin cobrar.
-- p_token_hash: hash del link permanente (/acceso/[token]); el token lo genera el servidor.
create function public.desbloquear_con_tokens(p_set uuid, p_token_hash text)
returns table (orden_id uuid, nueva boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_fan uuid := (select auth.uid());
  v_correo text := lower((select auth.jwt() ->> 'email'));
  s public.sets;
  v_tokens integer;
  v_saldo integer;
  v_orden uuid;
begin
  if v_fan is null or not exists (select 1 from public.fans where id = v_fan) then
    raise exception 'sin_cuenta_fan';
  end if;
  -- Serializa los desbloqueos del mismo fan: dos pestañas no gastan el mismo saldo.
  perform 1 from public.fans where id = v_fan for update;

  select * into s from public.sets where id = p_set and estado = 'publicado';
  if not found then
    raise exception 'set_no_disponible';
  end if;
  if s.precio_centavos <= 0 then
    raise exception 'set_gratis';
  end if;
  if public.esta_bloqueado(s.creadora_id, v_correo) then
    raise exception 'fan_bloqueado';
  end if;

  select o.id into v_orden from public.ordenes o
  where o.set_id = p_set and o.fan_id = v_fan and o.estado = 'pagada'
  limit 1;
  if found then
    return query select v_orden, false;
    return;
  end if;

  v_tokens := ceil(s.precio_centavos / 100.0)::integer;
  select coalesce(sum(tokens), 0) into v_saldo from public.movimientos_tokens where fan_id = v_fan;
  if v_saldo < v_tokens then
    raise exception 'saldo_insuficiente';
  end if;

  insert into public.ordenes (set_id, creadora_id, correo, fan_id, metodo, precio_centavos, comision_centavos, procesador)
  values (s.id, s.creadora_id, v_correo, v_fan, 'tokens', v_tokens * 100, round(v_tokens * 100 * 0.2)::integer, 'tokens')
  returning id into v_orden;
  perform public.confirmar_pago(v_orden, p_token_hash);
  insert into public.movimientos_tokens (fan_id, tipo, tokens, orden_id) values (v_fan, 'desbloqueo', -v_tokens, v_orden);

  return query select v_orden, true;
end $$;

revoke execute on function public.acreditar_tokens(uuid) from public, anon, authenticated;
revoke execute on function public.desbloquear_con_tokens(uuid, text) from public, anon;
grant execute on function public.desbloquear_con_tokens(uuid, text) to authenticated;

-- Veloo · 21 suscripción mensual con tokens.
--
--   suscribirse() ──▶ cobrar_periodo() ──▶ cobros_suscripcion
--                                     ├─▶ movimientos_tokens (−)  del fan
--                                     └─▶ movimientos_saldo (+neto) de la creadora, retenido 7 días
--   renovar_suscripciones() (cron) ──▶ cobrar_periodo() si le alcanza el saldo; si no, la detiene.
--
-- La creadora pone el precio en tokens por mes. Mientras la suscripción está activa, el fan ve todos
-- sus sets publicados (los de antes y los nuevos). El precio queda fijo para ese fan: si la creadora
-- lo cambia, aplica a quien se suscriba después. La comisión es la misma que en un set (20%).

-- ───────────────────────── oferta de la creadora ─────────────────────────

alter table public.creadoras
  add column suscripcion_tokens integer check (suscripcion_tokens is null or suscripcion_tokens between 49 and 2000),
  -- Inbox: si los fans que ya le compraron pueden escribirle.
  add column mensajes_abiertos boolean not null default true;

grant update (suscripcion_tokens, mensajes_abiertos) on public.creadoras to authenticated;

-- ───────────────────────── suscripciones ─────────────────────────

create table public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  fan_id uuid not null references public.fans (id) on delete restrict,
  creadora_id uuid not null references public.creadoras (id) on delete restrict,
  -- Lo que se cobra cada mes a este fan.
  tokens integer not null check (tokens > 0),
  -- Activa mientras periodo_hasta > now().
  periodo_hasta timestamptz not null,
  renovar boolean not null default true,
  fin_motivo text check (fin_motivo in ('cancelada', 'sin_saldo', 'creadora_la_quito', 'bloqueado')),
  creada_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (fan_id, creadora_id),
  check (fan_id <> creadora_id)
);

create index suscripciones_por_renovar_idx on public.suscripciones (periodo_hasta) where renovar;
create index suscripciones_creadora_idx on public.suscripciones (creadora_id, periodo_hasta);

create trigger suscripciones_actualizado before update on public.suscripciones
  for each row execute function public.tocar_actualizado();

create table public.cobros_suscripcion (
  id uuid primary key default gen_random_uuid(),
  suscripcion_id uuid not null references public.suscripciones (id) on delete restrict,
  fan_id uuid not null references public.fans (id) on delete restrict,
  creadora_id uuid not null references public.creadoras (id) on delete restrict,
  tokens integer not null check (tokens > 0),
  comision_centavos integer not null check (comision_centavos >= 0),
  neto_centavos integer generated always as (tokens * 100 - comision_centavos) stored,
  periodo_desde timestamptz not null,
  periodo_hasta timestamptz not null,
  creado_en timestamptz not null default now(),
  check (periodo_hasta > periodo_desde),
  check (comision_centavos <= tokens * 100)
);

create index cobros_suscripcion_creadora_idx on public.cobros_suscripcion (creadora_id, creado_en desc);

alter table public.suscripciones enable row level security;
alter table public.cobros_suscripcion enable row level security;

create policy "fan ve sus suscripciones" on public.suscripciones
  for select to authenticated using (fan_id = (select auth.uid()));
create policy "staff ve suscripciones" on public.suscripciones
  for select to authenticated using ((select public.es_staff()));
create policy "fan ve sus cobros de suscripción" on public.cobros_suscripcion
  for select to authenticated using (fan_id = (select auth.uid()));
create policy "staff ve cobros de suscripción" on public.cobros_suscripcion
  for select to authenticated using ((select public.es_staff()));

revoke insert, update, delete on public.suscripciones, public.cobros_suscripcion from anon, authenticated;

-- Los libros de tokens y de saldo ligan cada cobro, igual que una orden.
alter table public.movimientos_tokens
  add column cobro_suscripcion_id uuid unique references public.cobros_suscripcion (id),
  add constraint movimientos_tokens_suscripcion_check
    check (tipo <> 'suscripcion' or (cobro_suscripcion_id is not null and tokens < 0));

alter table public.movimientos_saldo
  add column cobro_suscripcion_id uuid unique references public.cobros_suscripcion (id),
  add constraint movimientos_saldo_suscripcion_check
    check (((tipo = 'suscripcion') = (cobro_suscripcion_id is not null)) and (tipo <> 'suscripcion' or monto_centavos > 0));

-- ───────────────────────── funciones ─────────────────────────

create function public.saldo_tokens_de(p_fan uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(tokens), 0)::integer from public.movimientos_tokens where fan_id = p_fan
$$;

create function public.suscripcion_activa(p_fan uuid, p_creadora uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.suscripciones
    where fan_id = p_fan and creadora_id = p_creadora and periodo_hasta > now()
  )
$$;

-- Interna: cobra un mes y extiende el periodo. Quien la llama ya bloqueó al fan y revisó el saldo.
create function public.cobrar_periodo(p_suscripcion uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  s public.suscripciones;
  v_desde timestamptz;
  v_hasta timestamptz;
  v_cobro uuid;
  v_comision integer;
begin
  select * into s from public.suscripciones where id = p_suscripcion for update;
  v_desde := greatest(s.periodo_hasta, now());
  v_hasta := v_desde + interval '1 month';
  v_comision := round(s.tokens * 100 * 0.2)::integer;

  insert into public.cobros_suscripcion (suscripcion_id, fan_id, creadora_id, tokens, comision_centavos, periodo_desde, periodo_hasta)
  values (s.id, s.fan_id, s.creadora_id, s.tokens, v_comision, v_desde, v_hasta)
  returning id into v_cobro;

  insert into public.movimientos_tokens (fan_id, tipo, tokens, cobro_suscripcion_id)
  values (s.fan_id, 'suscripcion', -s.tokens, v_cobro);

  insert into public.movimientos_saldo (creadora_id, tipo, monto_centavos, disponible_desde, cobro_suscripcion_id)
  values (s.creadora_id, 'suscripcion', s.tokens * 100 - v_comision, now() + interval '7 days', v_cobro);

  update public.suscripciones set periodo_hasta = v_hasta where id = s.id;
  return v_hasta;
end $$;

-- F9: el fan se suscribe con su saldo. Si ya está activa, solo reactiva la renovación (no cobra).
create function public.suscribirse(p_creadora uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_fan uuid := (select auth.uid());
  v_correo text := lower((select auth.jwt() ->> 'email'));
  c public.creadoras;
  s public.suscripciones;
  v_existe boolean;
begin
  if v_fan is null or not exists (select 1 from public.fans where id = v_fan) then
    raise exception 'sin_cuenta_fan';
  end if;
  -- Serializa con desbloqueos y otras suscripciones: el mismo saldo no se gasta dos veces.
  perform 1 from public.fans where id = v_fan for update;
  if (select mayor_edad_en from public.fans where id = v_fan) is null then
    raise exception 'falta_mayoria_edad';
  end if;
  if p_creadora = v_fan then
    raise exception 'suscripcion_propia';
  end if;

  select * into c from public.creadoras where id = p_creadora and verificacion = 'aprobada' and usuario is not null;
  if not found or c.suscripcion_tokens is null then
    raise exception 'suscripcion_no_disponible';
  end if;
  if public.esta_bloqueado(p_creadora, v_correo) then
    raise exception 'fan_bloqueado';
  end if;

  select * into s from public.suscripciones where fan_id = v_fan and creadora_id = p_creadora for update;
  v_existe := found;
  if v_existe and s.periodo_hasta > now() then
    update public.suscripciones set renovar = true, fin_motivo = null where id = s.id;
    return s.periodo_hasta;
  end if;

  if public.saldo_tokens_de(v_fan) < c.suscripcion_tokens then
    raise exception 'saldo_insuficiente';
  end if;

  if v_existe then
    update public.suscripciones set tokens = c.suscripcion_tokens, renovar = true, fin_motivo = null
    where id = s.id;
  else
    insert into public.suscripciones (fan_id, creadora_id, tokens, periodo_hasta)
    values (v_fan, p_creadora, c.suscripcion_tokens, now())
    returning * into s;
  end if;

  return public.cobrar_periodo(s.id);
end $$;

-- El fan cancela: sigue viendo todo hasta que termine el mes pagado.
create function public.cancelar_suscripcion(p_creadora uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_hasta timestamptz;
begin
  update public.suscripciones set renovar = false, fin_motivo = 'cancelada'
  where fan_id = (select auth.uid()) and creadora_id = p_creadora
  returning periodo_hasta into v_hasta;
  if not found then
    raise exception 'sin_suscripcion';
  end if;
  return v_hasta;
end $$;

-- Servidor (cron diario): renueva las que vencieron. Si no alcanza el saldo, la detiene.
create function public.renovar_suscripciones() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  s public.suscripciones;
  c public.creadoras;
  v_correo text;
  v_renovadas integer := 0;
begin
  for s in select * from public.suscripciones where renovar and periodo_hasta <= now() order by periodo_hasta loop
    perform 1 from public.fans where id = s.fan_id for update;
    select * into c from public.creadoras where id = s.creadora_id;
    select lower(email) into v_correo from auth.users where id = s.fan_id;

    if c.suscripcion_tokens is null or c.verificacion <> 'aprobada' then
      update public.suscripciones set renovar = false, fin_motivo = 'creadora_la_quito' where id = s.id;
    elsif public.esta_bloqueado(s.creadora_id, v_correo) then
      update public.suscripciones set renovar = false, fin_motivo = 'bloqueado' where id = s.id;
    elsif public.saldo_tokens_de(s.fan_id) < s.tokens then
      update public.suscripciones set renovar = false, fin_motivo = 'sin_saldo' where id = s.id;
    else
      perform public.cobrar_periodo(s.id);
      v_renovadas := v_renovadas + 1;
    end if;
  end loop;
  return v_renovadas;
end $$;

-- F7 por suscripción: ¿este fan puede ver este set sin haberlo comprado?
create function public.ver_por_suscripcion(p_set uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sets st
    where st.id = p_set and st.estado = 'publicado'
      and public.suscripcion_activa((select auth.uid()), st.creadora_id)
      and not public.esta_bloqueado(st.creadora_id, lower((select auth.jwt() ->> 'email')))
  )
$$;

revoke execute on function public.saldo_tokens_de(uuid) from public, anon, authenticated;
revoke execute on function public.suscripcion_activa(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cobrar_periodo(uuid) from public, anon, authenticated;
revoke execute on function public.renovar_suscripciones() from public, anon, authenticated;
revoke execute on function public.suscribirse(uuid) from public, anon;
revoke execute on function public.cancelar_suscripcion(uuid) from public, anon;
revoke execute on function public.ver_por_suscripcion(uuid) from public, anon;
grant execute on function public.suscribirse(uuid) to authenticated;
grant execute on function public.cancelar_suscripcion(uuid) to authenticated;
grant execute on function public.ver_por_suscripcion(uuid) to authenticated;

-- ───────────────────────── vistas ─────────────────────────

-- Fan: sus suscripciones, activas o no.
create view public.mis_suscripciones as
  select s.id, s.creadora_id, c.usuario as creadora_usuario, c.nombre as creadora_nombre, c.avatar_path as creadora_avatar,
         s.tokens, s.periodo_hasta, s.renovar, s.fin_motivo, (s.periodo_hasta > now()) as activa
  from public.suscripciones s
  join public.creadoras c on c.id = s.creadora_id
  where s.fan_id = (select auth.uid());

-- Creadora: cuántos suscriptores tiene y cuánto le dejaron. Nunca quiénes son.
create view public.mis_suscriptores as
  select
    (select count(*) from public.suscripciones s where s.creadora_id = (select auth.uid()) and s.periodo_hasta > now())::integer as activas,
    (select count(*) from public.suscripciones s where s.creadora_id = (select auth.uid()) and s.periodo_hasta > now() and s.renovar)::integer as se_renuevan,
    (select coalesce(sum(cs.neto_centavos), 0) from public.cobros_suscripcion cs
      where cs.creadora_id = (select auth.uid()) and cs.creado_en > now() - interval '30 days')::integer as neto_30_dias_centavos;

revoke all on public.mis_suscripciones, public.mis_suscriptores from anon;
grant select on public.mis_suscripciones, public.mis_suscriptores to authenticated;

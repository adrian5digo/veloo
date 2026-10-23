-- Comisión del 40% en operaciones nuevas. No recalcula órdenes ni cobros existentes.

create or replace function public.desbloquear_con_tokens(p_set uuid, p_token_hash text)
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
  values (s.id, s.creadora_id, v_correo, v_fan, 'tokens', v_tokens * 100, round(v_tokens * 100 * 0.4)::integer, 'tokens')
  returning id into v_orden;
  perform public.confirmar_pago(v_orden, p_token_hash);
  insert into public.movimientos_tokens (fan_id, tipo, tokens, orden_id) values (v_fan, 'desbloqueo', -v_tokens, v_orden);

  return query select v_orden, true;
end $$;

create or replace function public.cobrar_periodo(p_suscripcion uuid) returns timestamptz
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
  v_comision := round(s.tokens * 100 * 0.4)::integer;

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

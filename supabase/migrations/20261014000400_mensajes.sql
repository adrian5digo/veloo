-- Veloo · 22 inbox entre fan y creadora, y envío de sets a grupos de fans.
--
-- Reglas:
--   · El fan escribe primero solo si ya le compró algo a la creadora o está suscrito, tiene cuenta
--     y confirmó ser mayor de 18. Solo texto: nada de fotos (no hay cómo ponerles velo ni moderarlas).
--   · La creadora contesta con texto y puede adjuntar sus sets publicados (llegan con velo y precio).
--   · La creadora ve el nombre visible del fan (o su correo enmascarado), nunca el correo completo.
--   · Sin IA por ahora: la moderación es por reportes, bloqueos y límites de envío. El equipo solo
--     lee una conversación si alguien la reportó.
-- Todo se escribe por funciones; el navegador lee mensajes por RLS y las listas por vistas.

create table public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  fan_id uuid not null references public.fans (id) on delete cascade,
  ultimo_en timestamptz not null default now(),
  leida_creadora_en timestamptz not null default 'epoch',
  leida_fan_en timestamptz not null default 'epoch',
  creada_en timestamptz not null default now(),
  unique (creadora_id, fan_id),
  check (creadora_id <> fan_id)
);

create index conversaciones_creadora_idx on public.conversaciones (creadora_id, ultimo_en desc);
create index conversaciones_fan_idx on public.conversaciones (fan_id, ultimo_en desc);

create table public.mensajes (
  id bigint generated always as identity primary key,
  conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
  autor text not null check (autor in ('fan', 'creadora')),
  texto text check (texto is null or char_length(btrim(texto)) between 1 and 1000),
  set_id uuid references public.sets (id) on delete cascade,
  creado_en timestamptz not null default now(),
  check (texto is not null or set_id is not null),
  -- Solo la creadora adjunta sets.
  check (autor = 'creadora' or set_id is null)
);

create index mensajes_conversacion_idx on public.mensajes (conversacion_id, id desc);

-- Envíos de un set a un grupo de fans (C14): para el límite diario y para saber cuántos lo recibieron.
create table public.envios (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  set_id uuid not null references public.sets (id) on delete cascade,
  grupo text not null check (grupo in ('compradores', 'suscriptores', 'seguidores')),
  destinatarios integer not null default 0,
  creado_en timestamptz not null default now()
);

create index envios_creadora_idx on public.envios (creadora_id, creado_en desc);

alter table public.reportes add column conversacion_id uuid references public.conversaciones (id) on delete set null;

alter table public.conversaciones enable row level security;
alter table public.mensajes enable row level security;
alter table public.envios enable row level security;

create policy "participantes ven la conversación" on public.conversaciones
  for select to authenticated using (creadora_id = (select auth.uid()) or fan_id = (select auth.uid()));
create policy "participantes ven los mensajes" on public.mensajes
  for select to authenticated using (exists (
    select 1 from public.conversaciones c
    where c.id = conversacion_id and (c.creadora_id = (select auth.uid()) or c.fan_id = (select auth.uid()))
  ));
create policy "staff ve conversaciones reportadas" on public.conversaciones
  for select to authenticated using ((select public.es_staff()) and exists (select 1 from public.reportes r where r.conversacion_id = conversaciones.id));
create policy "staff ve mensajes reportados" on public.mensajes
  for select to authenticated using ((select public.es_staff()) and exists (select 1 from public.reportes r where r.conversacion_id = mensajes.conversacion_id));
create policy "creadora ve sus envíos" on public.envios
  for select to authenticated using (creadora_id = (select auth.uid()));

revoke insert, update, delete on public.conversaciones, public.mensajes, public.envios from anon, authenticated;

-- ───────────────────────── funciones ─────────────────────────

-- ¿Este fan ya le compró algo a la creadora (por cuenta o por correo) o está suscrito?
create function public.fan_de(p_fan uuid, p_correo text, p_creadora uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ordenes o
    where o.creadora_id = p_creadora and o.estado = 'pagada' and (o.fan_id = p_fan or o.correo = lower(btrim(p_correo)))
  ) or public.suscripcion_activa(p_fan, p_creadora)
$$;

create function public.texto_mensaje(p_texto text) returns text
language sql immutable set search_path = '' as $$
  select nullif(btrim(p_texto), '')
$$;

-- F8: el fan le escribe a una creadora. Devuelve la conversación.
create function public.escribir_a_creadora(p_creadora uuid, p_texto text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_fan uuid := (select auth.uid());
  v_correo text := lower((select auth.jwt() ->> 'email'));
  v_texto text := public.texto_mensaje(p_texto);
  v_conv uuid;
begin
  if v_fan is null or not exists (select 1 from public.fans where id = v_fan) then
    raise exception 'sin_cuenta_fan';
  end if;
  if (select mayor_edad_en from public.fans where id = v_fan) is null then
    raise exception 'falta_mayoria_edad';
  end if;
  if v_texto is null or char_length(v_texto) > 1000 then
    raise exception 'texto_invalido';
  end if;
  if not exists (
    select 1 from public.creadoras
    where id = p_creadora and verificacion = 'aprobada' and usuario is not null and mensajes_abiertos and id <> v_fan
  ) then
    raise exception 'mensajes_cerrados';
  end if;
  if public.esta_bloqueado(p_creadora, v_correo) then
    raise exception 'fan_bloqueado';
  end if;
  if not public.fan_de(v_fan, v_correo, p_creadora) then
    raise exception 'sin_compra';
  end if;

  insert into public.conversaciones (creadora_id, fan_id) values (p_creadora, v_fan)
  on conflict (creadora_id, fan_id) do nothing;
  select id into v_conv from public.conversaciones where creadora_id = p_creadora and fan_id = v_fan for update;

  if (select count(*) from public.mensajes
      where conversacion_id = v_conv and autor = 'fan' and creado_en > now() - interval '24 hours') >= 20 then
    raise exception 'demasiados_mensajes';
  end if;

  insert into public.mensajes (conversacion_id, autor, texto) values (v_conv, 'fan', v_texto);
  update public.conversaciones set ultimo_en = now(), leida_fan_en = now() where id = v_conv;
  return v_conv;
end $$;

-- C13: la creadora contesta, con texto y/o un set suyo publicado.
create function public.escribir_a_fan(p_conversacion uuid, p_texto text, p_set uuid) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_creadora uuid := (select auth.uid());
  v_texto text := public.texto_mensaje(p_texto);
  cv public.conversaciones;
  v_id bigint;
begin
  select * into cv from public.conversaciones where id = p_conversacion and creadora_id = v_creadora for update;
  if not found then
    raise exception 'conversacion_no_encontrada';
  end if;
  if v_texto is null and p_set is null then
    raise exception 'mensaje_vacio';
  end if;
  if v_texto is not null and char_length(v_texto) > 1000 then
    raise exception 'texto_invalido';
  end if;
  if public.esta_bloqueado(v_creadora, (select email from auth.users where id = cv.fan_id)) then
    raise exception 'fan_bloqueado';
  end if;
  if p_set is not null and not exists (
    select 1 from public.sets where id = p_set and creadora_id = v_creadora and estado = 'publicado'
  ) then
    raise exception 'set_no_disponible';
  end if;

  insert into public.mensajes (conversacion_id, autor, texto, set_id)
  values (cv.id, 'creadora', v_texto, p_set)
  returning id into v_id;
  update public.conversaciones set ultimo_en = now(), leida_creadora_en = now() where id = cv.id;
  return v_id;
end $$;

-- C14: la creadora manda un set a un grupo. No le llega a quien ya lo tiene, a bloqueados
-- ni a quien no ha confirmado ser mayor de edad. Máximo 3 envíos al día.
create function public.enviar_set_a_fans(p_set uuid, p_grupo text, p_texto text) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_creadora uuid := (select auth.uid());
  v_texto text := public.texto_mensaje(p_texto);
  v_envio uuid;
  v_fan record;
  v_conv uuid;
  v_n integer := 0;
begin
  if not exists (select 1 from public.sets where id = p_set and creadora_id = v_creadora and estado = 'publicado') then
    raise exception 'set_no_disponible';
  end if;
  if p_grupo not in ('compradores', 'suscriptores', 'seguidores') then
    raise exception 'grupo_invalido';
  end if;
  if v_texto is not null and char_length(v_texto) > 1000 then
    raise exception 'texto_invalido';
  end if;
  perform pg_advisory_xact_lock(hashtext('envio:' || v_creadora::text));
  if (select count(*) from public.envios where creadora_id = v_creadora and creado_en > now() - interval '24 hours') >= 3 then
    raise exception 'demasiados_envios';
  end if;

  insert into public.envios (creadora_id, set_id, grupo) values (v_creadora, p_set, p_grupo) returning id into v_envio;

  for v_fan in
    select f.id, lower(u.email) as correo
    from public.fans f
    join auth.users u on u.id = f.id
    where f.id <> v_creadora
      and f.mayor_edad_en is not null
      and case p_grupo
        when 'compradores' then exists (
          select 1 from public.ordenes o
          where o.creadora_id = v_creadora and o.estado = 'pagada' and (o.fan_id = f.id or o.correo = lower(u.email)))
        when 'suscriptores' then public.suscripcion_activa(f.id, v_creadora)
        else exists (select 1 from public.seguimientos sg where sg.fan_id = f.id and sg.creadora_id = v_creadora)
      end
      and not public.esta_bloqueado(v_creadora, u.email)
      and not exists (
        select 1 from public.ordenes o
        where o.set_id = p_set and o.estado = 'pagada' and (o.fan_id = f.id or o.correo = lower(u.email)))
  loop
    insert into public.conversaciones (creadora_id, fan_id) values (v_creadora, v_fan.id)
    on conflict (creadora_id, fan_id) do nothing;
    select id into v_conv from public.conversaciones where creadora_id = v_creadora and fan_id = v_fan.id;
    insert into public.mensajes (conversacion_id, autor, texto, set_id) values (v_conv, 'creadora', v_texto, p_set);
    update public.conversaciones set ultimo_en = now(), leida_creadora_en = now() where id = v_conv;
    v_n := v_n + 1;
  end loop;

  update public.envios set destinatarios = v_n where id = v_envio;
  return v_n;
end $$;

-- Cualquiera de los dos marca la conversación como leída.
create function public.marcar_leida(p_conversacion uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_yo uuid := (select auth.uid());
begin
  update public.conversaciones
  set leida_creadora_en = case when creadora_id = v_yo then now() else leida_creadora_en end,
      leida_fan_en = case when fan_id = v_yo then now() else leida_fan_en end
  where id = p_conversacion and (creadora_id = v_yo or fan_id = v_yo);
end $$;

-- Cualquiera de los dos reporta la conversación. Devuelve el folio. Solo así la ve el equipo.
create function public.reportar_conversacion(p_conversacion uuid, p_motivo public.motivo_reporte, p_detalle text)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_yo uuid := (select auth.uid());
  cv public.conversaciones;
  v_folio text;
begin
  select * into cv from public.conversaciones where id = p_conversacion and (creadora_id = v_yo or fan_id = v_yo);
  if not found then
    raise exception 'conversacion_no_encontrada';
  end if;
  insert into public.reportes (conversacion_id, creadora_id, motivo, detalle)
  values (cv.id, cv.creadora_id, p_motivo, nullif(btrim(p_detalle), ''))
  returning folio into v_folio;
  return v_folio;
end $$;

-- C13: la creadora bloquea al fan de esta conversación (por su correo, como desde una venta).
create function public.bloquear_desde_conversacion(p_conversacion uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cv public.conversaciones;
begin
  select * into cv from public.conversaciones where id = p_conversacion and creadora_id = (select auth.uid());
  if not found then
    raise exception 'conversacion_no_encontrada';
  end if;
  insert into public.bloqueos (creadora_id, correo)
  select cv.creadora_id, lower(btrim(u.email)) from auth.users u where u.id = cv.fan_id
  on conflict do nothing;
end $$;

revoke execute on function public.fan_de(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.escribir_a_creadora(uuid, text) from public, anon;
revoke execute on function public.escribir_a_fan(uuid, text, uuid) from public, anon;
revoke execute on function public.enviar_set_a_fans(uuid, text, text) from public, anon;
revoke execute on function public.marcar_leida(uuid) from public, anon;
revoke execute on function public.reportar_conversacion(uuid, public.motivo_reporte, text) from public, anon;
revoke execute on function public.bloquear_desde_conversacion(uuid) from public, anon;
grant execute on function public.escribir_a_creadora(uuid, text) to authenticated;
grant execute on function public.escribir_a_fan(uuid, text, uuid) to authenticated;
grant execute on function public.enviar_set_a_fans(uuid, text, text) to authenticated;
grant execute on function public.marcar_leida(uuid) to authenticated;
grant execute on function public.reportar_conversacion(uuid, public.motivo_reporte, text) to authenticated;
grant execute on function public.bloquear_desde_conversacion(uuid) to authenticated;

-- ───────────────────────── vistas ─────────────────────────

-- C12: bandeja de la creadora. Nombre visible del fan o su correo enmascarado.
create view public.bandeja_creadora as
  select cv.id,
         coalesce(f.nombre_visible, public.enmascarar_correo(lower(u.email))) as fan_nombre,
         (select count(*) from public.ordenes o
           where o.creadora_id = cv.creadora_id and o.estado = 'pagada' and (o.fan_id = cv.fan_id or o.correo = lower(u.email)))::integer as compras,
         -- En vistas se evalúa con permisos de quien consulta: nada de funciones internas aquí.
         exists (select 1 from public.suscripciones s
           where s.fan_id = cv.fan_id and s.creadora_id = cv.creadora_id and s.periodo_hasta > now()) as suscrito,
         exists (select 1 from public.bloqueos b
           where b.creadora_id = cv.creadora_id and b.correo = lower(btrim(u.email))) as bloqueado,
         ultimo.texto as ultimo_texto, ultimo.autor as ultimo_autor, (ultimo.set_id is not null) as ultimo_con_set,
         cv.ultimo_en,
         exists (select 1 from public.mensajes m where m.conversacion_id = cv.id and m.autor = 'fan' and m.creado_en > cv.leida_creadora_en) as sin_leer
  from public.conversaciones cv
  join public.fans f on f.id = cv.fan_id
  join auth.users u on u.id = cv.fan_id
  left join lateral (
    select m.texto, m.autor, m.set_id from public.mensajes m where m.conversacion_id = cv.id order by m.id desc limit 1
  ) ultimo on true
  where cv.creadora_id = (select auth.uid());

-- F8: bandeja del fan.
create view public.bandeja_fan as
  select cv.id, cv.creadora_id, c.usuario as creadora_usuario, coalesce(c.nombre, c.usuario) as creadora_nombre,
         c.avatar_path as creadora_avatar,
         ultimo.texto as ultimo_texto, ultimo.autor as ultimo_autor, (ultimo.set_id is not null) as ultimo_con_set,
         cv.ultimo_en,
         exists (select 1 from public.mensajes m where m.conversacion_id = cv.id and m.autor = 'creadora' and m.creado_en > cv.leida_fan_en) as sin_leer
  from public.conversaciones cv
  join public.creadoras c on c.id = cv.creadora_id
  left join lateral (
    select m.texto, m.autor, m.set_id from public.mensajes m where m.conversacion_id = cv.id order by m.id desc limit 1
  ) ultimo on true
  where cv.fan_id = (select auth.uid());

revoke all on public.bandeja_creadora, public.bandeja_fan from anon;
grant select on public.bandeja_creadora, public.bandeja_fan to authenticated;

-- ───────────────────────── rutas nuevas ─────────────────────────
-- /mensajes y /ver viven en el dominio principal; /suscripcion bajo el perfil de la creadora.
-- Un set no puede llamarse así (misma lista que RUTAS_APP en src/lib/dominio.ts).
create or replace function public.slug_reservado(s text) returns boolean
language sql immutable set search_path = '' as $$
  select s = any (array[
    'abrir', 'acceso', 'api', 'app', 'auth', 'avisos', 'cuenta', 'entrar', 'explorar', 'guardar', 'inicio',
    'l', 'mensajes', 'mis-compras', 'orden', 'panel', 'privacidad', 'reportar', 'sistema', 'suscripcion',
    'terminos', 'tokens', 'u', 'ver'
  ])
$$;

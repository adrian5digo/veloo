-- Veloo · 23 avisos por correo (Resend).
--
--   Set publicado ──▶ tomar_aviso_set()      ──▶ lista de aviso + seguidores (una sola vez por set)
--   Mensaje nuevo ──▶ tomar_aviso_mensaje()  ──▶ el otro lado (máximo un correo cada 3 h por conversación)
--   Envío a grupo ──▶ tomar_avisos_envio()   ──▶ cada fan que lo recibió (mismo límite de 3 h)
--   Link de baja  ──▶ dar_de_baja()          ──▶ ya no recibe avisos de esa creadora
--
-- Todo lo llama el servidor con la secret key, después de responder (next/server after()).

create table public.bajas_correo (
  correo text not null check (public.correo_valido(correo)),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (correo, creadora_id)
);

alter table public.bajas_correo enable row level security;
revoke all on public.bajas_correo from anon, authenticated;

alter table public.sets add column avisado_en timestamptz;
alter table public.conversaciones
  add column correo_creadora_en timestamptz,
  add column correo_fan_en timestamptz;

-- Set nuevo: marca el set como avisado y devuelve a quién escribirle. La segunda vez no devuelve nada.
-- No le llega a quien se dio de baja, a bloqueados ni a quien ya lo compró.
create function public.tomar_aviso_set(p_set uuid) returns table (destinatario text)
language plpgsql security definer set search_path = '' as $$
declare
  v_creadora uuid;
begin
  update public.sets set avisado_en = now()
  where id = p_set and estado = 'publicado' and avisado_en is null
  returning creadora_id into v_creadora;
  if not found then
    return;
  end if;

  return query
    select distinct d.c
    from (
      select la.correo as c from public.lista_aviso la where la.creadora_id = v_creadora
      union
      select lower(u.email) from public.seguimientos sg
      join public.fans f on f.id = sg.fan_id
      join auth.users u on u.id = sg.fan_id
      where sg.creadora_id = v_creadora and f.mayor_edad_en is not null
    ) d
    where d.c is not null
      and not exists (select 1 from public.bajas_correo b where b.correo = d.c and b.creadora_id = v_creadora)
      and not public.esta_bloqueado(v_creadora, d.c)
      and not exists (select 1 from public.ordenes o where o.set_id = p_set and o.estado = 'pagada' and o.correo = d.c);
end $$;

-- Mensaje nuevo para p_para ('fan' o 'creadora'). Devuelve su correo y quién le escribió,
-- o nada si ya le avisamos en las últimas 3 horas.
create function public.tomar_aviso_mensaje(p_conversacion uuid, p_para text) returns table (destinatario text, de text)
language plpgsql security definer set search_path = '' as $$
declare
  v_fan uuid;
  v_creadora uuid;
begin
  if p_para = 'fan' then
    update public.conversaciones set correo_fan_en = now()
    where id = p_conversacion and (correo_fan_en is null or correo_fan_en < now() - interval '3 hours')
    returning fan_id, creadora_id into v_fan, v_creadora;
    if not found then
      return;
    end if;
    return query
      select lower(u.email), coalesce(c.nombre, c.usuario)
      from auth.users u, public.creadoras c
      where u.id = v_fan and c.id = v_creadora and not public.esta_bloqueado(v_creadora, u.email);
  elsif p_para = 'creadora' then
    update public.conversaciones set correo_creadora_en = now()
    where id = p_conversacion and (correo_creadora_en is null or correo_creadora_en < now() - interval '3 hours')
    returning fan_id, creadora_id into v_fan, v_creadora;
    if not found then
      return;
    end if;
    return query
      select lower(u.email), coalesce(f.nombre_visible, 'Un fan')
      from auth.users u, public.fans f
      where u.id = v_creadora and f.id = v_fan;
  end if;
end $$;

-- Envío de un set a un grupo (C14): un correo por fan que lo recibió desde p_desde, con el mismo límite.
create function public.tomar_avisos_envio(p_creadora uuid, p_set uuid, p_desde timestamptz)
returns table (destinatario text, conversacion uuid)
language plpgsql security definer set search_path = '' as $$
begin
  return query
    with avisadas as (
      update public.conversaciones cv set correo_fan_en = now()
      where cv.creadora_id = p_creadora
        and (cv.correo_fan_en is null or cv.correo_fan_en < now() - interval '3 hours')
        and exists (
          select 1 from public.mensajes m
          where m.conversacion_id = cv.id and m.set_id = p_set and m.autor = 'creadora' and m.creado_en >= p_desde
        )
      returning cv.id as conv, cv.fan_id as fan
    )
    select lower(u.email), a.conv
    from avisadas a
    join auth.users u on u.id = a.fan
    where not exists (select 1 from public.bajas_correo b where b.correo = lower(u.email) and b.creadora_id = p_creadora);
end $$;

-- Link de baja: ya no recibe avisos de esa creadora (y sale de su lista de aviso).
create function public.dar_de_baja(p_correo text, p_creadora uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_correo text := lower(btrim(p_correo));
begin
  if not public.correo_valido(v_correo) or not exists (select 1 from public.creadoras where id = p_creadora) then
    raise exception 'baja_invalida';
  end if;
  insert into public.bajas_correo (correo, creadora_id) values (v_correo, p_creadora) on conflict do nothing;
  delete from public.lista_aviso where creadora_id = p_creadora and correo = v_correo;
end $$;

revoke execute on function public.tomar_aviso_set(uuid) from public, anon, authenticated;
revoke execute on function public.tomar_aviso_mensaje(uuid, text) from public, anon, authenticated;
revoke execute on function public.tomar_avisos_envio(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.dar_de_baja(text, uuid) from public, anon, authenticated;

-- /baja (página del link de baja) vive en el dominio principal: un set no puede llamarse así.
create or replace function public.slug_reservado(s text) returns boolean
language sql immutable set search_path = '' as $$
  select s = any (array[
    'abrir', 'acceso', 'api', 'app', 'auth', 'avisos', 'baja', 'cuenta', 'entrar', 'explorar', 'guardar', 'inicio',
    'l', 'mensajes', 'mis-compras', 'orden', 'panel', 'privacidad', 'reportar', 'sistema', 'suscripcion',
    'terminos', 'tokens', 'u', 'ver'
  ])
$$;

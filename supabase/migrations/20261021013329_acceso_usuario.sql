-- Nombre de acceso independiente del link público. No guarda contraseñas: las gestiona Auth.
create table public.usuarios_acceso (
  id uuid primary key references auth.users(id) on delete cascade,
  usuario text not null unique check (
    usuario = lower(btrim(usuario))
    and usuario ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$'
    and public.usuario_permitido(replace(usuario, '_', '-'))
  )
);
alter table public.usuarios_acceso enable row level security;
revoke all on public.usuarios_acceso from anon, authenticated;
grant select on public.usuarios_acceso to authenticated;
grant all on public.usuarios_acceso to service_role;
create policy "solo mi nombre de acceso" on public.usuarios_acceso for select to authenticated using (id = (select auth.uid()));

-- Reserva los nombres de las creadoras existentes sin cambiar sus links.
insert into public.usuarios_acceso(id, usuario)
  select id, usuario from public.creadoras where usuario is not null;

create function public.crear_usuario_acceso() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_usuario text := lower(btrim(new.raw_user_meta_data->>'usuario_acceso'));
begin
  if v_usuario is not null then
    insert into public.usuarios_acceso(id, usuario) values(new.id, v_usuario);
  end if;
  return new;
end;
$$;
revoke all on function public.crear_usuario_acceso() from public, anon, authenticated;
create trigger crear_usuario_acceso after insert on auth.users
  for each row execute function public.crear_usuario_acceso();

-- Una sesión autenticada solo puede reservar/cambiar su propio nombre.
create function public.asignar_usuario_acceso(p_usuario text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'sesion_requerida'; end if;
  insert into public.usuarios_acceso(id, usuario) values(auth.uid(), lower(btrim(p_usuario)))
    on conflict(id) do update set usuario = excluded.usuario;
end;
$$;
revoke all on function public.asignar_usuario_acceso(text) from public, anon;
grant execute on function public.asignar_usuario_acceso(text) to authenticated;

-- Límite atómico por usuario: la función de entrada lo consulta antes de validar la contraseña.
create table public.intentos_acceso (
  clave text primary key check(char_length(clave) = 64),
  desde timestamptz not null default now(),
  cantidad integer not null default 1
);
alter table public.intentos_acceso enable row level security;
revoke all on public.intentos_acceso from public, anon, authenticated;
grant all on public.intentos_acceso to service_role;
create function public.tomar_intento_acceso(p_clave text) returns boolean
language plpgsql set search_path = '' as $$
declare v_cantidad integer;
begin
  insert into public.intentos_acceso(clave) values(p_clave)
  on conflict(clave) do update set
    cantidad = case when public.intentos_acceso.desde < now() - interval '15 minutes' then 1 else public.intentos_acceso.cantidad + 1 end,
    desde = case when public.intentos_acceso.desde < now() - interval '15 minutes' then now() else public.intentos_acceso.desde end
  returning cantidad into v_cantidad;
  return v_cantidad <= 10;
end;
$$;
revoke all on function public.tomar_intento_acceso(text) from public, anon, authenticated;
grant execute on function public.tomar_intento_acceso(text) to service_role;

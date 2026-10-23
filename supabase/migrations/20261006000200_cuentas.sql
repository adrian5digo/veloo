-- Veloo · 02 cuentas: creadoras, fans, ajustes y notificaciones push.

create type public.estado_verificacion as enum ('pendiente', 'en_revision', 'aprobada', 'rechazada');

-- Subdominio [usuario].veloo.vip: 3–30 caracteres, minúsculas, números y guiones; sin reservados.
create function public.usuario_permitido(usuario text) returns boolean
language sql immutable set search_path = '' as $$
  select usuario ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
    and usuario not in ('www', 'app', 'api', 'admin', 'panel', 'soporte', 'ayuda', 'veloo', 'mail', 'correo',
                        'static', 'cdn', 'blog', 'legal', 'status', 'pagos', 'entrar', 'auth')
$$;

-- ───────────────────────── creadoras ─────────────────────────
-- Perfil público. Lo sensible (INE, fecha de nacimiento, datos fiscales) vive en creadoras_privado.

create table public.creadoras (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text unique check (usuario is null or public.usuario_permitido(usuario)),
  usuario_cambiado_en timestamptz,
  nombre text check (char_length(nombre) <= 60),
  bio text check (char_length(bio) <= 120),
  avatar_path text,
  verificacion public.estado_verificacion not null default 'pendiente',
  creada_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger creadoras_actualizado before update on public.creadoras
  for each row execute function public.tocar_actualizado();

-- C8: el subdominio se puede cambiar cada 90 días.
create function public.limitar_cambio_usuario() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.usuario is distinct from old.usuario then
    if old.usuario is not null and old.usuario_cambiado_en > now() - interval '90 days' then
      raise exception 'usuario_cambiado_hace_poco' using hint = 'El subdominio se puede cambiar cada 90 días';
    end if;
    new.usuario_cambiado_en := now();
  end if;
  return new;
end $$;

create trigger creadoras_limitar_usuario before update of usuario on public.creadoras
  for each row execute function public.limitar_cambio_usuario();

alter table public.creadoras enable row level security;

create policy "creadora ve su perfil" on public.creadoras
  for select to authenticated using (id = (select auth.uid()));

create policy "perfiles verificados son públicos" on public.creadoras
  for select to anon, authenticated using (verificacion = 'aprobada' and usuario is not null);

create policy "creadora crea su perfil" on public.creadoras
  for insert to authenticated with check (id = (select auth.uid()));

create policy "creadora edita su perfil" on public.creadoras
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- La verificación solo la cambia el servidor (proveedor de identidad / panel).
revoke insert, update on public.creadoras from anon, authenticated;
grant insert (id, usuario, nombre, bio) on public.creadoras to authenticated;
grant update (usuario, nombre, bio, avatar_path) on public.creadoras to authenticated;

create table public.creadoras_privado (
  id uuid primary key references public.creadoras (id) on delete cascade,
  -- De la INE (C1b, C2): los llena el servidor después de verificar. No editables por la creadora.
  nombre_legal text,
  fecha_nacimiento date,
  -- C8 datos fiscales, para el CFDI mensual de comisiones.
  rfc text check (rfc is null or rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  regimen_fiscal text check (regimen_fiscal is null or regimen_fiscal ~ '^[0-9]{3}$'),
  codigo_postal_fiscal text check (codigo_postal_fiscal is null or codigo_postal_fiscal ~ '^[0-9]{5}$'),
  actualizado_en timestamptz not null default now()
);

create trigger creadoras_privado_actualizado before update on public.creadoras_privado
  for each row execute function public.tocar_actualizado();

alter table public.creadoras_privado enable row level security;

create policy "creadora ve sus datos privados" on public.creadoras_privado
  for select to authenticated using (id = (select auth.uid()));

create policy "creadora edita sus datos fiscales" on public.creadoras_privado
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke insert, update on public.creadoras_privado from anon, authenticated;
grant update (rfc, regimen_fiscal, codigo_postal_fiscal) on public.creadoras_privado to authenticated;

-- C8: notificaciones y bloqueo de países.
create table public.ajustes_creadora (
  creadora_id uuid primary key references public.creadoras (id) on delete cascade,
  notificar_ventas boolean not null default true,
  notificar_retiros boolean not null default true,
  notificar_moderacion boolean not null default true,
  -- Códigos ISO 3166-1 alfa-2 donde su perfil no se muestra.
  paises_bloqueados text[] not null default '{}'
    check (array_to_string(paises_bloqueados, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$')
);

alter table public.ajustes_creadora enable row level security;

create policy "creadora ve sus ajustes" on public.ajustes_creadora
  for select to authenticated using (creadora_id = (select auth.uid()));
create policy "creadora crea sus ajustes" on public.ajustes_creadora
  for insert to authenticated with check (creadora_id = (select auth.uid()));
create policy "creadora edita sus ajustes" on public.ajustes_creadora
  for update to authenticated using (creadora_id = (select auth.uid())) with check (creadora_id = (select auth.uid()));

-- ───────────────────────── fans ─────────────────────────
-- Comprar no pide cuenta: las compras se ligan al correo. La cuenta (L3) es opcional y se crea
-- con el mismo correo; "mis_compras" junta ambas cosas.

create table public.fans (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_visible text check (char_length(nombre_visible) between 1 and 40),
  creado_en timestamptz not null default now()
);

alter table public.fans enable row level security;

create policy "fan ve su cuenta" on public.fans
  for select to authenticated using (id = (select auth.uid()));
create policy "fan crea su cuenta" on public.fans
  for insert to authenticated with check (id = (select auth.uid()));
create policy "fan edita su cuenta" on public.fans
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- P3: suscripciones de notificaciones web push (creadoras y fans).
create table public.suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_clave text not null,
  creada_en timestamptz not null default now()
);

alter table public.suscripciones_push enable row level security;

create policy "usuario maneja sus suscripciones" on public.suscripciones_push
  for all to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- Veloo · 01 base: utilidades y personal interno.
--
-- Convenciones de todo el esquema:
-- - Dinero en centavos (integer). Nunca float.
-- - Correos guardados en minúsculas; el servidor normaliza antes de insertar.
-- - RLS activo en todas las tablas. Sin política = nadie desde el navegador; el servidor usa la secret key.
-- - Datos sensibles (correo del fan, CLABE, INE) no se leen directo: van por vistas que enmascaran.
-- - Las reglas que bloquean algo (firmas, retiro mínimo, pausa de CLABE) se cumplen aquí, no solo en el front.

-- Correos: siempre en minúsculas (lo exige un check). Comparar con lower() del lado de la entrada.
create function public.correo_valido(correo text) returns boolean
language sql immutable set search_path = '' as $$
  select correo = lower(btrim(correo)) and correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
$$;

-- Actualiza actualizado_en en cada UPDATE.
create function public.tocar_actualizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

-- "fan@correo.com" → "f•••@correo.com" (C11: la creadora nunca ve el correo completo).
create function public.enmascarar_correo(correo text) returns text
language sql immutable set search_path = '' as $$
  select case
    when position('@' in correo) > 1 then left(correo, 1) || '•••' || substr(correo, position('@' in correo))
    else '•••'
  end
$$;

-- CLABE: 18 dígitos y dígito de control (pesos 3, 7, 1).
create function public.clabe_valida(clabe text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  suma int := 0;
  pesos int[] := array[3, 7, 1];
begin
  if clabe is null or clabe !~ '^[0-9]{18}$' then
    return false;
  end if;
  for i in 1..17 loop
    suma := suma + (substr(clabe, i, 1)::int * pesos[((i - 1) % 3) + 1]) % 10;
  end loop;
  return (10 - suma % 10) % 10 = substr(clabe, 18, 1)::int;
end $$;

-- ───────────────────────── personal interno (panel) ─────────────────────────

create type public.rol_staff as enum ('moderacion', 'soporte', 'admin');

create table public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_staff not null,
  nombre text not null,
  creado_en timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "staff se ve a sí mismo" on public.staff
  for select to authenticated using (id = (select auth.uid()));

create function public.es_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where id = (select auth.uid()))
$$;

-- Todo lo que el personal abre sin velo o con datos de identidad queda registrado (A1, A2).
create table public.registro_staff (
  id bigint generated always as identity primary key,
  staff_id uuid not null references public.staff (id),
  accion text not null,
  recurso_tipo text not null,
  recurso_id uuid not null,
  creado_en timestamptz not null default now()
);

create index registro_staff_recurso_idx on public.registro_staff (recurso_tipo, recurso_id);

alter table public.registro_staff enable row level security;

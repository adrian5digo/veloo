-- Veloo · 03 verificación de identidad de la creadora (C2, C2b, C2c, A2).
-- Cada intento es una fila: si se pide otra foto, se crea un intento nuevo.
-- Los archivos van en el bucket privado "identidad".

create type public.estado_intento_identidad as enum ('pendiente', 'aprobada', 'pide_otra_foto', 'rechazada');

create table public.verificaciones (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  estado public.estado_intento_identidad not null default 'pendiente',
  proveedor text,
  proveedor_ref text,
  ine_frente_path text,
  ine_reverso_path text,
  selfie_path text,
  -- Comprobaciones automáticas (A2).
  edad_detectada integer,
  coincidencia_facial numeric(5, 2) check (coincidencia_facial between 0 and 100),
  prueba_vida boolean,
  ine_vigente boolean,
  calidad_ok boolean,
  -- Decisión del panel.
  motivo text,
  decidida_por uuid references public.staff (id),
  decidida_en timestamptz,
  creada_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index verificaciones_creadora_idx on public.verificaciones (creadora_id, creada_en desc);
create index verificaciones_pendientes_idx on public.verificaciones (creada_en) where estado = 'pendiente';

create trigger verificaciones_actualizado before update on public.verificaciones
  for each row execute function public.tocar_actualizado();

-- El estado de la creadora sigue al último intento.
create function public.sincronizar_verificacion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.creadoras
  set verificacion = case new.estado
    when 'pendiente' then 'en_revision'
    when 'aprobada' then 'aprobada'
    when 'rechazada' then 'rechazada'
    when 'pide_otra_foto' then 'pendiente'
  end::public.estado_verificacion
  where id = new.creadora_id;
  return new;
end $$;

create trigger verificaciones_sincronizar after insert or update of estado on public.verificaciones
  for each row execute function public.sincronizar_verificacion();

alter table public.verificaciones enable row level security;

create policy "creadora ve sus intentos" on public.verificaciones
  for select to authenticated using (creadora_id = (select auth.uid()));

create policy "staff ve verificaciones" on public.verificaciones
  for select to authenticated using ((select public.es_staff()));

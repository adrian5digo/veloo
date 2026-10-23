-- Excepción temporal del piloto. La lista se configura por separado, nunca desde el cliente.
create table public.creadoras_prueba (
  creadora_id uuid primary key references public.creadoras(id) on delete cascade,
  motivo text not null,
  activa boolean not null default true,
  creada_en timestamptz not null default now()
);
create table public.publicaciones_prueba (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.sets(id) on delete cascade,
  creadora_id uuid not null references public.creadoras(id) on delete cascade,
  motivo text not null,
  creada_en timestamptz not null default now()
);
alter table public.creadoras_prueba enable row level security;
alter table public.publicaciones_prueba enable row level security;
revoke all on public.creadoras_prueba, public.publicaciones_prueba from public, anon, authenticated;
grant all on public.creadoras_prueba, public.publicaciones_prueba to service_role;

create function public.publicar_set_de_prueba() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_motivo text;
begin
  select motivo into v_motivo from public.creadoras_prueba
  where creadora_id = new.creadora_id and activa;
  if v_motivo is null then return new; end if;
  if not exists (select 1 from public.creadoras where id = new.creadora_id and verificacion = 'aprobada') then
    raise exception 'creadora_no_verificada';
  end if;
  if new.declaracion_en is null then raise exception 'falta_declaracion'; end if;
  if not exists (select 1 from public.medios where set_id = new.id) then raise exception 'set_sin_medios'; end if;
  if exists (select 1 from public.medios where set_id = new.id and estado <> 'lista') then raise exception 'medios_pendientes'; end if;
  if exists (select 1 from public.personas_set where set_id = new.id and estado_firma <> 'firmada')
    or (new.con_otras_personas and not exists (select 1 from public.personas_set where set_id = new.id))
  then raise exception 'faltan_firmas'; end if;
  -- No republicar contenido oculto por reportes, consentimiento o retirado.
  if old.estado not in ('borrador','rechazado','moderacion') then return new; end if;
  new.estado := 'publicado';
  new.publicado_en := coalesce(new.publicado_en, now());
  new.motivo_rechazo := null;
  insert into public.publicaciones_prueba(set_id, creadora_id, motivo)
  values (new.id, new.creadora_id, v_motivo);
  return new;
end $$;
revoke execute on function public.publicar_set_de_prueba() from public, anon, authenticated;
create trigger sets_publicacion_prueba before update of estado on public.sets
for each row when (new.estado = 'moderacion')
execute function public.publicar_set_de_prueba();

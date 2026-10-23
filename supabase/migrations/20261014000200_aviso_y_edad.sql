-- Veloo · 20 lista de aviso y mayoría de edad del fan.
--
-- Lista de aviso (F1): quien llega desde una historia deja su correo para enterarse del próximo set,
-- aunque la creadora todavía no publique nada. Sin cuenta. La creadora solo ve cuántos correos hay.
--
-- Mayoría de edad: Veloo no tiene contenido para adultos, pero es solo para mayores de 18.
-- El fan lo confirma una vez (antes de comprar tokens) y queda con la fecha en su cuenta.

-- ───────────────────────── edad ─────────────────────────

alter table public.fans add column mayor_edad_en timestamptz;

-- El fan ya no escribe directo la fecha: solo su nombre (el upsert de L3 manda también el id).
revoke update on public.fans from anon, authenticated;
grant update (id, nombre_visible) on public.fans to authenticated;

-- Fan con sesión: "Confirmo que tengo 18 años o más". Crea su fila de fan si no existe.
-- La primera fecha no se sobrescribe.
create function public.confirmar_mayoria_edad() returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_fan uuid := (select auth.uid());
  v_fecha timestamptz;
begin
  if v_fan is null then
    raise exception 'sin_sesion';
  end if;
  insert into public.fans (id) values (v_fan) on conflict (id) do nothing;
  update public.fans set mayor_edad_en = coalesce(mayor_edad_en, now())
  where id = v_fan
  returning mayor_edad_en into v_fecha;
  return v_fecha;
end $$;

revoke execute on function public.confirmar_mayoria_edad() from public, anon;
grant execute on function public.confirmar_mayoria_edad() to authenticated;

-- ───────────────────────── lista de aviso ─────────────────────────

create table public.lista_aviso (
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  correo text not null check (public.correo_valido(correo)),
  creado_en timestamptz not null default now(),
  primary key (creadora_id, correo)
);

alter table public.lista_aviso enable row level security;

-- Mientras no hay correo transaccional, el equipo manda los avisos a mano.
create policy "staff ve listas de aviso" on public.lista_aviso
  for select to authenticated using ((select public.es_staff()));

revoke insert, update, delete on public.lista_aviso from anon, authenticated;

-- Cualquiera (sin sesión) se apunta. Repetir el correo no hace nada.
create function public.pedir_aviso(p_creadora uuid, p_correo text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_correo text := lower(btrim(p_correo));
begin
  if not exists (
    select 1 from public.creadoras where id = p_creadora and verificacion = 'aprobada' and usuario is not null
  ) then
    raise exception 'creadora_no_disponible';
  end if;
  if not public.correo_valido(v_correo) then
    raise exception 'correo_invalido';
  end if;
  insert into public.lista_aviso (creadora_id, correo) values (p_creadora, v_correo) on conflict do nothing;
end $$;

revoke execute on function public.pedir_aviso(uuid, text) from public;
grant execute on function public.pedir_aviso(uuid, text) to anon, authenticated;

-- La creadora ve cuántos esperan, nunca los correos.
create view public.mi_lista_aviso as
  select count(*)::integer as correos, max(creado_en) as ultimo_en
  from public.lista_aviso
  where creadora_id = (select auth.uid());

revoke all on public.mi_lista_aviso from anon;
grant select on public.mi_lista_aviso to authenticated;

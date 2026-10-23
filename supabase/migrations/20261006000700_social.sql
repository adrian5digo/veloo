-- Veloo · 07 lado social: seguir, me gusta, bloqueos y contadores públicos (S1–S3, L3, C11).

create table public.seguimientos (
  fan_id uuid not null references public.fans (id) on delete cascade,
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (fan_id, creadora_id)
);

create index seguimientos_creadora_idx on public.seguimientos (creadora_id);

alter table public.seguimientos enable row level security;

create policy "fan ve a quién sigue" on public.seguimientos
  for select to authenticated using (fan_id = (select auth.uid()));
create policy "fan sigue" on public.seguimientos
  for insert to authenticated with check (fan_id = (select auth.uid()));
create policy "fan deja de seguir" on public.seguimientos
  for delete to authenticated using (fan_id = (select auth.uid()));

create table public.me_gusta (
  fan_id uuid not null references public.fans (id) on delete cascade,
  set_id uuid not null references public.sets (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (fan_id, set_id)
);

create index me_gusta_set_idx on public.me_gusta (set_id);

alter table public.me_gusta enable row level security;

create policy "fan ve sus me gusta" on public.me_gusta
  for select to authenticated using (fan_id = (select auth.uid()));
create policy "fan da me gusta a sets publicados" on public.me_gusta
  for insert to authenticated
  with check (fan_id = (select auth.uid()) and exists (select 1 from public.sets s where s.id = set_id and s.estado = 'publicado'));
create policy "fan quita me gusta" on public.me_gusta
  for delete to authenticated using (fan_id = (select auth.uid()));

-- Contadores públicos sin exponer quién sigue a quién.
create view public.contadores_creadora as
  select c.id as creadora_id,
         (select count(*) from public.seguimientos sg where sg.creadora_id = c.id) as seguidores,
         (select count(*) from public.sets s where s.creadora_id = c.id and s.estado = 'publicado') as sets_publicados
  from public.creadoras c
  where c.verificacion = 'aprobada' and c.usuario is not null;

create view public.contadores_set as
  select s.id as set_id, (select count(*) from public.me_gusta mg where mg.set_id = s.id) as me_gusta
  from public.sets s
  where s.estado = 'publicado';

grant select on public.contadores_creadora, public.contadores_set to anon, authenticated;

-- C11 "Bloquear a este fan": por correo, porque el fan puede no tener cuenta.
-- La creadora bloquea desde una venta y nunca ve el correo completo.
create table public.bloqueos (
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  correo text not null,
  orden_id uuid references public.ordenes (id) on delete set null,
  creado_en timestamptz not null default now(),
  primary key (creadora_id, correo)
);

alter table public.bloqueos enable row level security;

create view public.mis_bloqueos as
  select public.enmascarar_correo(b.correo) as correo, b.orden_id, b.creado_en
  from public.bloqueos b
  where b.creadora_id = (select auth.uid());

revoke all on public.mis_bloqueos from anon;
grant select on public.mis_bloqueos to authenticated;

create function public.bloquear_fan(p_orden uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.ordenes;
begin
  select * into o from public.ordenes where id = p_orden and creadora_id = (select auth.uid());
  if not found then
    raise exception 'orden_no_encontrada';
  end if;
  insert into public.bloqueos (creadora_id, correo, orden_id)
  values (o.creadora_id, o.correo, o.id)
  on conflict do nothing;
end $$;

create function public.desbloquear_fan(p_orden uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.bloqueos b
  using public.ordenes o
  where o.id = p_orden and o.creadora_id = (select auth.uid())
    and b.creadora_id = o.creadora_id and b.correo = o.correo
$$;

-- Lo usa el checkout (servidor) antes de crear una orden.
create function public.esta_bloqueado(p_creadora uuid, p_correo text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bloqueos where creadora_id = p_creadora and correo = lower(btrim(p_correo)))
$$;

revoke execute on function public.bloquear_fan(uuid) from public, anon;
revoke execute on function public.desbloquear_fan(uuid) from public, anon;
grant execute on function public.bloquear_fan(uuid) to authenticated;
grant execute on function public.desbloquear_fan(uuid) to authenticated;
revoke execute on function public.esta_bloqueado(uuid, text) from public, anon, authenticated;

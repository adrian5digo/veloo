-- Veloo · 17 links de la creadora (tipo Linktree) y slugs que no chocan con rutas de la app.
--
-- [usuario].veloo.vip muestra su perfil con sus links (Instagram, TikTok, YouTube, su web…) y sus sets.
-- En el subdominio, /tokens, /entrar, /mis-compras, etc. llevan a la app; por eso un set no puede
-- tener esos slugs.

-- ───────────────────────── slugs reservados ─────────────────────────
create function public.slug_reservado(s text) returns boolean
language sql immutable set search_path = '' as $$
  select s = any (array[
    'abrir', 'acceso', 'api', 'app', 'auth', 'avisos', 'cuenta', 'entrar', 'explorar', 'guardar', 'inicio',
    'l', 'mis-compras', 'orden', 'panel', 'privacidad', 'reportar', 'sistema', 'terminos', 'tokens', 'u'
  ])
$$;

create or replace function public.asignar_slug() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text := left(public.slug_de(new.titulo), 60);
  candidato text := base;
  n int := 1;
begin
  -- Un candado por creadora para que dos sets con el mismo título no choquen.
  perform pg_advisory_xact_lock(hashtext('slug:' || new.creadora_id::text));
  while public.slug_reservado(candidato)
     or exists (select 1 from public.sets where creadora_id = new.creadora_id and slug = candidato) loop
    n := n + 1;
    candidato := base || '-' || n;
  end loop;
  new.slug := candidato;
  return new;
end $$;

revoke execute on function public.asignar_slug() from public, anon, authenticated;

-- ───────────────────────── links ─────────────────────────
create type public.red_link as enum (
  'instagram', 'tiktok', 'x', 'youtube', 'twitch', 'spotify', 'whatsapp', 'telegram', 'facebook', 'threads', 'web'
);

create table public.links_creadora (
  id uuid primary key default gen_random_uuid(),
  creadora_id uuid not null references public.creadoras (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 40),
  -- Solo https: nada de javascript:, data: ni http sin cifrar.
  url text not null check (char_length(url) <= 300 and url ~ '^https://[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]+)?([/?#][^[:space:]]*)?$'),
  red public.red_link not null default 'web',
  orden integer not null default 0,
  activo boolean not null default true,
  clics integer not null default 0 check (clics >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index links_creadora_idx on public.links_creadora (creadora_id, orden);

create trigger links_actualizado before update on public.links_creadora
  for each row execute function public.tocar_actualizado();

-- Máximo 20 por creadora.
create function public.limite_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('links:' || new.creadora_id::text));
  if (select count(*) from public.links_creadora where creadora_id = new.creadora_id) >= 20 then
    raise exception 'limite_links';
  end if;
  return new;
end $$;

create trigger links_limite before insert on public.links_creadora
  for each row execute function public.limite_links();

revoke execute on function public.limite_links() from public, anon, authenticated;

alter table public.links_creadora enable row level security;

create policy "links activos de creadoras verificadas son públicos" on public.links_creadora
  for select to anon, authenticated
  using (activo and exists (select 1 from public.creadoras c where c.id = creadora_id and c.verificacion = 'aprobada'));
create policy "creadora ve sus links" on public.links_creadora
  for select to authenticated using (creadora_id = (select auth.uid()));
create policy "creadora crea sus links" on public.links_creadora
  for insert to authenticated with check (creadora_id = (select auth.uid()));
create policy "creadora edita sus links" on public.links_creadora
  for update to authenticated using (creadora_id = (select auth.uid())) with check (creadora_id = (select auth.uid()));
create policy "creadora borra sus links" on public.links_creadora
  for delete to authenticated using (creadora_id = (select auth.uid()));

-- La creadora no toca clics ni fechas; solo el contenido del link.
revoke insert, update on public.links_creadora from anon, authenticated;
grant insert (creadora_id, titulo, url, red, orden, activo) on public.links_creadora to authenticated;
grant update (titulo, url, red, orden, activo) on public.links_creadora to authenticated;

-- Cualquiera (anon) al tocar un link: suma un clic y devuelve a dónde ir. null si ya no existe.
create function public.abrir_link(p_link uuid) returns text
language sql security definer set search_path = '' as $$
  update public.links_creadora l set clics = l.clics + 1
  where l.id = p_link and l.activo
    and exists (select 1 from public.creadoras c where c.id = l.creadora_id and c.verificacion = 'aprobada')
  returning l.url
$$;

revoke execute on function public.abrir_link(uuid) from public;
grant execute on function public.abrir_link(uuid) to anon, authenticated;

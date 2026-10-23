-- Veloo · 11 slug de los sets y motivos de rechazo.

-- ───────────────────────── slug (C5, F3) ─────────────────────────
-- El link del set es [usuario].veloo.vip/[slug]. Se genera del título al crear el set
-- y no cambia aunque se edite el título: un link ya compartido en Instagram sigue sirviendo.

create function public.slug_de(texto text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(btrim(regexp_replace(
    lower(translate(texto, 'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ', 'aeiouunaeiouunaeiouaeiou')),
    '[^a-z0-9]+', '-', 'g'), '-'), ''), 'set')
$$;

alter table public.sets add column slug text check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 70);

create function public.asignar_slug() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text := left(public.slug_de(new.titulo), 60);
  candidato text := base;
  n int := 1;
begin
  -- Un candado por creadora para que dos sets con el mismo título no choquen.
  perform pg_advisory_xact_lock(hashtext('slug:' || new.creadora_id::text));
  while exists (select 1 from public.sets where creadora_id = new.creadora_id and slug = candidato) loop
    n := n + 1;
    candidato := base || '-' || n;
  end loop;
  new.slug := candidato;
  return new;
end $$;

create trigger sets_slug before insert on public.sets
  for each row execute function public.asignar_slug();

revoke execute on function public.asignar_slug() from public, anon, authenticated;

-- Sets que ya existían.
update public.sets s set slug = public.slug_de(s.titulo) || '-' || left(s.id::text, 4) where slug is null;

alter table public.sets alter column slug set not null;
create unique index sets_slug_idx on public.sets (creadora_id, slug);

-- ───────────────────────── motivos de rechazo (A1, E4) ─────────────────────────
-- El texto es exactamente lo que lee la creadora.

insert into public.motivos_rechazo (codigo, texto_para_creadora) values
  ('tercero_sin_firma', 'Falta el consentimiento de una persona que aparece en una de las fotos. Quita esa foto o mándale el formulario y vuelve a enviar el set.'),
  ('posible_menor', 'Una persona parece menor de edad. Por seguridad no podemos publicarlo; si es un error, escríbenos con su identificación.'),
  ('datos_personales', 'Se ve información personal (dirección, placas o documentos). Recórtala o tápala y vuelve a enviarlo.'),
  ('calidad', 'Varias fotos salen borrosas o muy oscuras. Súbelas en mejor calidad y lo revisamos de nuevo.'),
  ('contenido_prohibido', 'Este set incluye contenido que no se permite en Veloo según la sección 4 de los términos.')
on conflict (codigo) do nothing;

-- Veloo · 05 compras: órdenes, accesos permanentes y eventos del procesador de pagos (F4–F7, S4).
--
-- Comprar no pide cuenta: la orden se liga al correo. Al pagarse se crea un acceso con un token
-- (el link permanente que llega por correo). Solo se guarda el hash del token.
-- Todo lo escribe el servidor; el navegador lee por las vistas mis_compras y mis_ventas.

create type public.metodo_pago as enum ('tarjeta', 'oxxo', 'spei');
create type public.estado_orden as enum ('pendiente', 'pagada', 'vencida', 'rechazada', 'reembolsada', 'contracargo');

create table public.ordenes (
  id uuid primary key default gen_random_uuid(),
  folio bigint generated always as identity unique,
  set_id uuid not null references public.sets (id) on delete restrict,
  creadora_id uuid not null references public.creadoras (id) on delete restrict,
  correo text not null check (public.correo_valido(correo)),
  fan_id uuid references public.fans (id) on delete set null,
  metodo public.metodo_pago not null,
  estado public.estado_orden not null default 'pendiente',
  -- Copia del precio al momento de comprar; la comisión (20%) incluye procesamiento.
  precio_centavos integer not null check (precio_centavos > 0),
  comision_centavos integer not null check (comision_centavos >= 0),
  neto_centavos integer generated always as (precio_centavos - comision_centavos) stored,
  procesador text not null,
  procesador_ref text,
  -- OXXO (72 h) y SPEI (CLABE única por compra).
  oxxo_referencia text,
  spei_clabe text check (spei_clabe is null or public.clabe_valida(spei_clabe)),
  spei_referencia text,
  vence_en timestamptz,
  pais text check (pais ~ '^[A-Z]{2}$'),
  pagada_en timestamptz,
  creada_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (procesador, procesador_ref),
  check (comision_centavos <= precio_centavos),
  check (estado <> 'pagada' or pagada_en is not null)
);

create index ordenes_creadora_idx on public.ordenes (creadora_id, creada_en desc);
create index ordenes_correo_idx on public.ordenes (correo);
create index ordenes_fan_idx on public.ordenes (fan_id) where fan_id is not null;
create index ordenes_set_idx on public.ordenes (set_id);
create index ordenes_por_vencer_idx on public.ordenes (vence_en) where estado = 'pendiente';

create trigger ordenes_actualizado before update on public.ordenes
  for each row execute function public.tocar_actualizado();

create table public.accesos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null unique references public.ordenes (id) on delete cascade,
  set_id uuid not null references public.sets (id) on delete restrict,
  correo text not null,
  token_hash text not null unique,
  creado_en timestamptz not null default now(),
  revocado_en timestamptz,
  ultimo_uso_en timestamptz
);

create index accesos_correo_idx on public.accesos (correo);

-- Webhooks del procesador: se guardan todos y se procesan una sola vez (idempotencia).
create table public.eventos_pago (
  id bigint generated always as identity primary key,
  procesador text not null,
  evento_id text not null,
  tipo text not null,
  orden_id uuid references public.ordenes (id),
  payload jsonb not null,
  recibido_en timestamptz not null default now(),
  procesado_en timestamptz,
  unique (procesador, evento_id)
);

alter table public.ordenes enable row level security;
alter table public.accesos enable row level security;
alter table public.eventos_pago enable row level security;

create policy "staff ve órdenes" on public.ordenes
  for select to authenticated using ((select public.es_staff()));

-- S4 Mis compras: por cuenta de fan o por el correo con el que entró.
create view public.mis_compras as
  select o.id, o.folio, o.set_id, s.titulo, s.portada_id, c.usuario as creadora_usuario, c.nombre as creadora_nombre,
         o.metodo, o.estado, o.precio_centavos, o.oxxo_referencia, o.spei_clabe, o.spei_referencia, o.vence_en,
         o.pagada_en, o.creada_en
  from public.ordenes o
  join public.sets s on s.id = o.set_id
  join public.creadoras c on c.id = o.creadora_id
  where o.estado in ('pendiente', 'pagada', 'vencida')
    and (o.fan_id = (select auth.uid()) or o.correo = lower((select auth.jwt() ->> 'email')));

-- C6 / C11 Ventas de la creadora: el correo del fan siempre enmascarado.
create view public.mis_ventas as
  select o.id, o.folio, o.set_id, s.titulo, public.enmascarar_correo(o.correo) as correo,
         o.metodo, o.estado, o.precio_centavos, o.comision_centavos, o.neto_centavos,
         o.pagada_en, o.pagada_en + interval '7 days' as disponible_en, o.creada_en
  from public.ordenes o
  join public.sets s on s.id = o.set_id
  where o.creadora_id = (select auth.uid()) and o.estado in ('pagada', 'reembolsada', 'contracargo');

revoke all on public.mis_compras, public.mis_ventas from anon;
grant select on public.mis_compras, public.mis_ventas to authenticated;

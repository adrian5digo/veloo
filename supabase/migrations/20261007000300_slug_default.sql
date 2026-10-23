-- Veloo · 12 el slug lo pone el trigger asignar_slug(); el default solo evita que
-- el cliente tenga que mandarlo (la creadora no tiene permiso sobre esa columna).
alter table public.sets alter column slug set default 'set';

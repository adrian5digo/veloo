-- Veloo · 19 valores nuevos de enums para suscripciones e inbox.
-- Van en su propia migración: Postgres no deja usar un valor recién agregado en la misma transacción.

alter type public.tipo_movimiento add value if not exists 'suscripcion';
alter type public.tipo_movimiento_tokens add value if not exists 'suscripcion';
-- Para reportar una conversación (además de los motivos que ya existen).
alter type public.motivo_reporte add value if not exists 'acoso';

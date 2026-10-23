-- Veloo · 15 método de pago "tokens" (va solo: un valor nuevo de enum no se puede usar en la misma transacción).
alter type public.metodo_pago add value if not exists 'tokens';

-- Veloo · 10 permisos de funciones internas (advisor de seguridad de Supabase).
--
-- Las funciones de trigger no se deben poder llamar por /rest/v1/rpc. Postgres revisa EXECUTE
-- solo al crear el trigger, no al dispararlo, así que quitarlo no afecta a los triggers.
revoke execute on function public.sincronizar_verificacion() from public, anon, authenticated;
revoke execute on function public.ocultar_por_consentimiento() from public, anon, authenticated;
revoke execute on function public.procesar_reporte() from public, anon, authenticated;

-- es_staff() la usan las políticas "staff ve …", que son solo para authenticated.
revoke execute on function public.es_staff() from public, anon;

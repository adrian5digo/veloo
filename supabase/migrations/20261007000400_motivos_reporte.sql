-- Veloo · 13 motivos de reporte de R1 que faltaban en el enum.
-- R1: "Es contenido robado de otra persona" y "Muestra datos personales". Ninguno es urgente.
alter type public.motivo_reporte add value if not exists 'contenido_robado';
alter type public.motivo_reporte add value if not exists 'datos_personales';

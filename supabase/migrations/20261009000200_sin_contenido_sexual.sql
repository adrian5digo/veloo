-- Veloo · 18 sin desnudos ni contenido sexual.
--
-- Veloo deja de ser para adultos (cobra con Stripe). Moderación rechaza con un motivo propio,
-- y "contenido prohibido" lo nombra para que la creadora sepa qué quitar.

insert into public.motivos_rechazo (codigo, texto_para_creadora) values
  ('contenido_sexual', 'Este set tiene desnudos o contenido sexual, y eso no se permite en Veloo. Quita esas fotos y vuelve a enviarlo.')
on conflict (codigo) do nothing;

update public.motivos_rechazo
  set texto_para_creadora = 'Este set incluye contenido que no se permite en Veloo (desnudos, contenido sexual u otro de la sección 4 de los términos).'
  where codigo = 'contenido_prohibido';

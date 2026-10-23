-- Veloo · 09 storage. Sin políticas: solo el servidor lee y escribe.
-- Los velos se leen por URL pública; lo demás, con links firmados que caducan.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  -- Lo que sube la creadora, tal cual. Se borra al procesar (trae EXIF con GPS).
  ('subidas', 'subidas', false, 4294967296,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/heic', 'image/heif',
          'video/mp4', 'video/quicktime']),
  -- Versiones nítidas: original limpio, vista para la dueña, HLS cifrado del video.
  ('privado', 'privado', false, 4294967296, null),
  -- Lo único público: archivos con velo generados en el servidor.
  ('velos', 'velos', true, 52428800, array['image/webp', 'video/mp4']),
  -- INE, selfies y firmas (creadoras y personas que aparecen en sets).
  ('identidad', 'identidad', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

/** Tipos y límites de medios compartidos entre cliente y servidor. */

export const MAX_BYTES_FOTO = 40 * 1024 * 1024;

export type TamanoVelo = "mini" | "grande";

/** Lo que la app de la creadora recibe de una foto procesada. */
export type MedioSubido = {
  id: string;
  ancho: number;
  alto: number;
  /** Versiones con velo: públicas, sirven para la página del fan y para la bóveda. */
  velo: Record<TamanoVelo, string>;
  /** Versión nítida para "mantener presionado". Solo la dueña puede pedirla. */
  vista: string;
};

/** Respuesta al pedir permiso para subir: la foto va directo a storage, no pasa por Next. */
export type SubidaPreparada = { id: string; url: string };

export const ID_MEDIO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** URL pública del velo en el CDN de Supabase Storage. */
export function urlVelo(id: string, tamano: TamanoVelo) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/velos/${id}/${tamano}.webp`;
}

export function urlsDeMedio(id: string): Pick<MedioSubido, "velo" | "vista"> {
  return {
    velo: { mini: urlVelo(id, "mini"), grande: urlVelo(id, "grande") },
    vista: `/api/creadora/medios/${id}/vista`,
  };
}

/** Foto de perfil pública (sin EXIF, 400px). `path` viene de creadoras.avatar_path. */
export function urlAvatar(path: string | null) {
  return path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/velos/${path}` : undefined;
}

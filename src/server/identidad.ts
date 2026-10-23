import "server-only";
import { supabaseAdmin } from "./supabase";

/**
 * Archivos de verificación de identidad (C2, C2b) en el bucket privado "identidad".
 * Mientras no haya proveedor de INE + prueba de vida, el equipo los revisa a mano en A2.
 */

export const PIEZAS = ["ine_frente", "ine_reverso", "selfie"] as const;
export type Pieza = (typeof PIEZAS)[number];

export const rutaIdentidad = (creadoraId: string, intentoId: string, pieza: Pieza) =>
  `${creadoraId}/${intentoId}/${pieza}.jpg`;

/** Links firmados de subida para las 3 fotos de un intento nuevo. */
export async function prepararIntento(creadoraId: string, intentoId: string) {
  const db = supabaseAdmin();
  const urls = await Promise.all(
    PIEZAS.map(async (p) => {
      const { data, error } = await db.storage.from("identidad").createSignedUploadUrl(rutaIdentidad(creadoraId, intentoId, p), { upsert: true });
      if (error) throw error;
      return [p, data.signedUrl] as const;
    }),
  );
  return Object.fromEntries(urls) as Record<Pieza, string>;
}

/** ¿Ya están las 3 fotos en storage? */
export async function intentoCompleto(creadoraId: string, intentoId: string) {
  const { data, error } = await supabaseAdmin().storage.from("identidad").list(`${creadoraId}/${intentoId}`);
  if (error) throw error;
  const nombres = new Set(data.map((f) => f.name));
  return PIEZAS.every((p) => nombres.has(`${p}.jpg`));
}

/** Links de 10 min para que el equipo vea las fotos (A2). Registrar el acceso antes. */
export async function urlsIdentidad(paths: (string | null)[]) {
  const validos = paths.filter((p): p is string => !!p);
  if (!validos.length) return [];
  const { data, error } = await supabaseAdmin().storage.from("identidad").createSignedUrls(validos, 600);
  if (error) throw error;
  return data.map((d) => d.signedUrl).filter((u): u is string => !!u);
}

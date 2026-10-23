import "server-only";
import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { ID_MEDIO, MAX_BYTES_FOTO, urlsDeMedio, type MedioSubido, type SubidaPreparada, type TamanoVelo } from "@/lib/medios";
import { supabaseAdmin } from "./supabase";

/**
 * Fotos de la creadora.
 *
 * 1. prepararSubida: el navegador recibe un link firmado y sube la foto normal directo a
 *    storage ("subidas"), sin pasar por Next (Vercel limita el cuerpo a 4.5 MB).
 * 2. procesarFoto: el servidor la descarga y genera archivos nuevos:
 *    - privado/original.jpg  nítida, sin EXIF (quita GPS y cámara), máx. 4096px. Para compradores.
 *    - privado/vista.webp    nítida, 1600px. Solo la dueña, al mantener presionado.
 *    - velos/mini|grande     se reduce a 12px y se agranda desenfocada. Al tirar la información
 *                            en la reducción, no se puede revertir. Es lo único público.
 *    Al terminar se borra la subida original (con su EXIF).
 */

/** Lado mayor (px) al que se reduce la foto antes de desenfocar. Más chico = menos información. */
const LADO_SEMILLA = 12;

const VELOS: Record<TamanoVelo, { ancho: number; blur: number }> = {
  mini: { ancho: 320, blur: 10 },
  grande: { ancho: 1080, blur: 36 },
};

const FORMATOS_ACEPTADOS = new Set(["jpeg", "png", "webp", "tiff", "heif"]);

const ruta = {
  subida: (creadora: string, id: string) => `${creadora}/${id}`,
  original: (creadora: string, id: string) => `${creadora}/${id}/original.jpg`,
  vista: (creadora: string, id: string) => `${creadora}/${id}/vista.webp`,
  velo: (id: string, t: TamanoVelo) => `${id}/${t}.webp`,
};

export class ErrorMedio extends Error {}

type FilaFoto = {
  id: string;
  creadora_id: string;
  set_id: string | null;
  estado: "subiendo" | "procesando" | "lista" | "error";
};

async function fotoDe(id: string, creadoraId: string): Promise<FilaFoto | null> {
  if (!ID_MEDIO.test(id)) return null;
  const { data, error } = await supabaseAdmin()
    .from("medios")
    .select("id, creadora_id, set_id, estado")
    .eq("id", id)
    .maybeSingle<FilaFoto>();
  if (error) throw error;
  return data && data.creadora_id === creadoraId ? data : null;
}

export async function prepararSubida(creadoraId: string): Promise<SubidaPreparada> {
  const db = supabaseAdmin();
  const id = randomUUID();
  const { error } = await db.from("medios").insert({ id, creadora_id: creadoraId, tipo: "foto" });
  if (error) throw error;
  const { data, error: e2 } = await db.storage.from("subidas").createSignedUploadUrl(ruta.subida(creadoraId, id));
  if (e2) throw e2;
  return { id, url: data.signedUrl };
}

function abrir(datos: Buffer) {
  // Límite de píxeles contra imágenes "bomba"; rotate() aplica la orientación EXIF.
  return sharp(datos, { limitInputPixels: 120_000_000, failOn: "error" }).rotate();
}

export async function procesarFoto(id: string, creadoraId: string): Promise<MedioSubido> {
  const db = supabaseAdmin();
  if (!ID_MEDIO.test(id)) throw new ErrorMedio("No encontramos esa subida. Vuelve a intentar.");
  // Se marca "procesando" de forma atómica: si llegan dos peticiones, solo una procesa.
  const { data: tomada, error: e0 } = await db
    .from("medios")
    .update({ estado: "procesando" })
    .eq("id", id)
    .eq("creadora_id", creadoraId)
    .eq("estado", "subiendo")
    .select("id");
  if (e0) throw e0;
  if (!tomada?.length) throw new ErrorMedio("No encontramos esa subida. Vuelve a intentar.");

  const { data: blob, error } = await db.storage.from("subidas").download(ruta.subida(creadoraId, id));
  if (error || !blob) throw new ErrorMedio("La foto no terminó de subir. Vuelve a intentar.");
  if (blob.size > MAX_BYTES_FOTO) {
    await descartar(id, creadoraId);
    throw new ErrorMedio(`Pesa más de ${MAX_BYTES_FOTO / 1024 / 1024} MB. Súbela en menor resolución.`);
  }
  const datos = Buffer.from(await blob.arrayBuffer());

  let versiones: Awaited<ReturnType<typeof generarVersiones>>;
  try {
    versiones = await generarVersiones(datos);
  } catch (e) {
    await descartar(id, creadoraId);
    throw e;
  }
  const { ancho, alto, original, vista, velos } = versiones;

  const subir = async (bucket: string, path: string, buf: Buffer, contentType: string, cache: string) => {
    const { error } = await db.storage.from(bucket).upload(path, buf, { contentType, cacheControl: cache, upsert: true });
    if (error) throw error;
  };
  await Promise.all([
    subir("privado", ruta.original(creadoraId, id), original, "image/jpeg", "0"),
    subir("privado", ruta.vista(creadoraId, id), vista, "image/webp", "0"),
    ...velos.map(([t, buf]) => subir("velos", ruta.velo(id, t), buf, "image/webp", "31536000")),
  ]);

  const { error: e2 } = await db
    .from("medios")
    .update({ estado: "lista", ancho, alto, bytes: datos.length })
    .eq("id", id);
  if (e2) throw e2;
  // La subida trae el EXIF original (GPS incluido): no se guarda.
  await db.storage.from("subidas").remove([ruta.subida(creadoraId, id)]);

  return { id, ancho, alto, ...urlsDeMedio(id) };
}

async function generarVersiones(datos: Buffer) {
  let info: Metadata;
  try {
    info = await sharp(datos).metadata();
  } catch {
    throw new ErrorMedio("No es una foto que podamos leer. Súbela como JPG o PNG.");
  }
  if (!info.format || !FORMATOS_ACEPTADOS.has(info.format) || !info.width || !info.height) {
    throw new ErrorMedio("Ese formato no lo leemos. Súbela como JPG o PNG.");
  }
  const girada = (info.orientation ?? 1) >= 5;
  const ancho = girada ? info.height : info.width;
  const alto = girada ? info.width : info.height;

  let original: Buffer, vista: Buffer, semilla: Buffer;
  try {
    [original, vista, semilla] = await Promise.all([
      abrir(datos)
        .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer(),
      abrir(datos)
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
      abrir(datos).resize({ width: LADO_SEMILLA, height: LADO_SEMILLA, fit: "inside" }).png().toBuffer(),
    ]);
  } catch {
    // Ej. HEIC con HEVC: el binario de sharp no trae ese decodificador.
    throw new ErrorMedio("Ese formato no lo leemos. Súbela como JPG o PNG.");
  }

  const velos = await Promise.all(
    (Object.keys(VELOS) as TamanoVelo[]).map(async (t) => {
      const { ancho: w, blur } = VELOS[t];
      // Se reescala con la proporción real; la semilla redondeada la deformaría.
      const h = Math.round((w * alto) / ancho);
      const buf = await sharp(semilla)
        .resize({ width: w, height: h, fit: "fill", kernel: "cubic" })
        .blur(blur)
        .webp({ quality: 70 })
        .toBuffer();
      return [t, buf] as const;
    }),
  );

  return { ancho, alto, original, vista, velos };
}

/** Quita una subida que no se pudo procesar. */
async function descartar(id: string, creadoraId: string) {
  const db = supabaseAdmin();
  await db.storage.from("subidas").remove([ruta.subida(creadoraId, id)]);
  await db.from("medios").delete().eq("id", id);
}

/** Link firmado de 60 s a la versión nítida. null si no existe o no es suya. */
export async function urlVista(id: string, creadoraId: string) {
  const foto = await fotoDe(id, creadoraId);
  if (!foto || foto.estado !== "lista") return null;
  const { data, error } = await supabaseAdmin().storage.from("privado").createSignedUrl(ruta.vista(creadoraId, id), 60);
  if (error) throw error;
  return data.signedUrl;
}

/** Portada para exportar a historias. Solo su dueña; siempre se entrega ya desenfocada, sin EXIF. */
export async function portadaHistoria(id: string, creadoraId: string) {
  const foto = await fotoDe(id, creadoraId);
  if (!foto || foto.estado !== "lista" || !foto.set_id) return null;
  const db = supabaseAdmin();
  const { data: set, error: setError } = await db.from("sets").select("id").eq("id", foto.set_id).eq("creadora_id", creadoraId).eq("portada_id", id).eq("estado", "publicado").maybeSingle();
  if (setError) throw setError;
  if (!set) return null;
  const { data, error } = await db.storage.from("privado").download(ruta.original(creadoraId, id));
  if (error) throw error;
  const semilla = await sharp(Buffer.from(await data.arrayBuffer())).rotate().resize(48, 60, { fit: "cover" }).png().toBuffer();
  return sharp(semilla).resize(888, 720, { fit: "cover" }).blur(18).webp({ quality: 80 }).toBuffer();
}

/**
 * Borra una foto que todavía no está en un set enviado. false si no existe, no es suya
 * o ya está en moderación / publicada (ahí se quita desde el set).
 */
export async function borrarFoto(id: string, creadoraId: string) {
  const foto = await fotoDe(id, creadoraId);
  if (!foto) return false;
  const db = supabaseAdmin();
  if (foto.set_id) {
    const { data } = await db.from("sets").select("estado").eq("id", foto.set_id).single<{ estado: string }>();
    if (data && data.estado !== "borrador") return false;
  }
  await Promise.all([
    db.storage.from("subidas").remove([ruta.subida(creadoraId, id)]),
    db.storage.from("privado").remove([ruta.original(creadoraId, id), ruta.vista(creadoraId, id)]),
    db.storage.from("velos").remove([ruta.velo(id, "mini"), ruta.velo(id, "grande")]),
  ]);
  const { error } = await db.from("medios").delete().eq("id", id);
  if (error) throw error;
  return true;
}

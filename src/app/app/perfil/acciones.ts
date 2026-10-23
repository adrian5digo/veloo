"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import type { Database } from "@/lib/database.types";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true } | { ok: false; error: string };
const SESION = "Tu sesión se cerró. Entra de nuevo; no se perdió nada.";

export async function cerrarSesion() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/");
}

/** C8: toggles de notificaciones. */
export async function guardarNotificacion(
  campo: "notificar_ventas" | "notificar_retiros" | "notificar_moderacion",
  valor: boolean,
): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const supabase = await supabaseServidor();
  const fila: Database["public"]["Tables"]["ajustes_creadora"]["Insert"] = { creadora_id: creadora.id };
  fila[campo] = valor;
  const { error } = await supabase.from("ajustes_creadora").upsert(fila, { onConflict: "creadora_id" });
  if (error) throw error;
  return { ok: true };
}

/** C9: nombre, bio y, si quiere, un link nuevo (cada 90 días; lo hace cumplir la base). */
export async function guardarPerfil(datos: { nombre: string; bio: string; usuario?: string }): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const nombre = datos.nombre.trim();
  const bio = datos.bio.trim();
  if (!nombre || nombre.length > 60) return { ok: false, error: "Tu nombre va de 1 a 60 letras." };
  if (bio.length > 120) return { ok: false, error: "La bio es de máximo 120 letras." };

  const cambios: { nombre: string; bio: string | null; usuario?: string } = { nombre, bio: bio || null };
  if (datos.usuario !== undefined) {
    const usuario = datos.usuario.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(usuario)) {
      return { ok: false, error: "Tu link usa de 3 a 30 letras minúsculas, números o guiones." };
    }
    cambios.usuario = usuario;
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase.from("creadoras").update(cambios).eq("id", creadora.id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ese link ya lo tiene alguien más. Prueba con otro." };
    if (error.code === "23514") return { ok: false, error: "Ese link no se puede usar. Prueba con otro." };
    if (error.message.includes("usuario_cambiado_hace_poco")) {
      return { ok: false, error: "Cambiaste tu link hace menos de 90 días. Tu nombre y bio sí se pueden guardar sin cambiarlo." };
    }
    throw error;
  }
  revalidatePath("/app/perfil");
  return { ok: true };
}

/** C9: foto de perfil. Pública: se recorta a 400px y se le quita el EXIF. */
export async function subirAvatar(datos: FormData): Promise<Resultado & { url?: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const archivo = datos.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "Elige una foto." };
  if (archivo.size > 1024 * 1024) return { ok: false, error: "La foto pesa más de 1 MB. Elige otra." };

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await archivo.arrayBuffer()), { limitInputPixels: 60_000_000 })
      .rotate()
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { ok: false, error: "Esa foto no la pudimos leer. Prueba con un JPG o PNG." };
  }

  const db = supabaseAdmin();
  const { data: actual } = await db.from("creadoras").select("avatar_path").eq("id", creadora.id).single();
  // Nombre nuevo en cada cambio: el CDN no sirve la foto anterior.
  const path = `avatares/${creadora.id}-${Date.now()}.webp`;
  const { error } = await db.storage.from("velos").upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw error;
  const { error: e2 } = await db.from("creadoras").update({ avatar_path: path }).eq("id", creadora.id);
  if (e2) throw e2;
  if (actual?.avatar_path) await db.storage.from("velos").remove([actual.avatar_path]);

  revalidatePath("/app/perfil");
  return { ok: true, url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/velos/${path}` };
}

/** Datos fiscales para el CFDI mensual de comisiones. */
export async function guardarFiscales(datos: { rfc: string; regimen: string; cp: string }): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const rfc = datos.rfc.trim().toUpperCase();
  if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(rfc)) return { ok: false, error: "Revisa el RFC: son 12 o 13 caracteres, con homoclave." };
  if (!/^[0-9]{3}$/.test(datos.regimen)) return { ok: false, error: "Elige tu régimen fiscal." };
  if (!/^[0-9]{5}$/.test(datos.cp)) return { ok: false, error: "El código postal son 5 dígitos." };

  // La fila la crea el registro (C1b); la creadora solo puede editar estas tres columnas.
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("creadoras_privado")
    .update({ rfc, regimen_fiscal: datos.regimen, codigo_postal_fiscal: datos.cp })
    .eq("id", creadora.id)
    .select("id");
  if (error) throw error;
  if (!data.length) return { ok: false, error: "Termina tu registro antes de capturar datos fiscales." };
  revalidatePath("/app/perfil");
  return { ok: true };
}

/** Países donde su página no se muestra (ISO 3166-1 alfa-2). */
export async function guardarPaises(paises: string[]): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const limpios = [...new Set(paises)].filter((p) => /^[A-Z]{2}$/.test(p));
  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from("ajustes_creadora")
    .upsert({ creadora_id: creadora.id, paises_bloqueados: limpios }, { onConflict: "creadora_id" });
  if (error) throw error;
  revalidatePath("/app/perfil");
  return { ok: true };
}

/** C8: si los fans que ya le compraron (o están suscritos) pueden escribirle primero. */
export async function guardarMensajesAbiertos(abiertos: boolean): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("creadoras").update({ mensajes_abiertos: abiertos }).eq("id", creadora.id);
  if (error) throw error;
  revalidatePath("/app/perfil");
  return { ok: true };
}

/** C16: suscripción mensual. null la apaga para nuevos fans; quien ya está suscrito sigue hasta su fecha. */
export async function guardarSuscripcion(tokens: number | null): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  if (tokens !== null && (!Number.isInteger(tokens) || tokens < 49 || tokens > 2000)) {
    return { ok: false, error: "El precio va de 49 a 2,000 tokens al mes." };
  }
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("creadoras").update({ suscripcion_tokens: tokens }).eq("id", creadora.id);
  if (error) throw error;
  revalidatePath("/app/perfil");
  return { ok: true };
}

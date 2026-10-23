"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { avisarEnvio, avisarMensaje } from "@/server/correo";
import { ERRORES_MENSAJE } from "@/lib/mensajes";
import { ID_MEDIO } from "@/lib/medios";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true } | { ok: false; error: string };
// Los tipos generados marcan los argumentos de las funciones como no nulos; p_set y p_texto sí aceptan null.
const SESION = "Tu sesión se cerró. Entra de nuevo; no se envió nada.";

const ERRORES_ENVIO: Record<string, string> = {
  grupo_invalido: "Elige a quién mandárselo.",
  demasiados_envios: "Ya hiciste 3 envíos hoy. Mañana puedes mandar otro; los de hoy sí llegaron.",
};

function error(mensaje: string): Resultado | null {
  const texto = ERRORES_MENSAJE[mensaje] ?? ERRORES_ENVIO[mensaje];
  return texto ? { ok: false, error: texto } : null;
}

/** C13: contesta con texto y/o un set suyo publicado. */
export async function responder(conversacionId: string, texto: string, setId: string | null): Promise<Resultado> {
  if (!ID_MEDIO.test(conversacionId) || (setId && !ID_MEDIO.test(setId))) return { ok: false, error: ERRORES_MENSAJE.conversacion_no_encontrada };
  if (!(await creadoraActual())) return { ok: false, error: SESION };
  const supabase = await supabaseServidor();
  const { error: e } = await supabase.rpc("escribir_a_fan", { p_conversacion: conversacionId, p_texto: texto, p_set: setId as string });
  if (e) {
    const r = error(e.message);
    if (r) return r;
    throw e;
  }
  after(() => avisarMensaje(conversacionId, "fan"));
  revalidatePath("/app/mensajes");
  return { ok: true };
}

/** C13: bloquea al fan de esta conversación (no le puede escribir ni comprarle). */
export async function bloquearFan(conversacionId: string): Promise<Resultado> {
  if (!ID_MEDIO.test(conversacionId)) return { ok: false, error: ERRORES_MENSAJE.conversacion_no_encontrada };
  if (!(await creadoraActual())) return { ok: false, error: SESION };
  const supabase = await supabaseServidor();
  const { error: e } = await supabase.rpc("bloquear_desde_conversacion", { p_conversacion: conversacionId });
  if (e) {
    const r = error(e.message);
    if (r) return r;
    throw e;
  }
  revalidatePath("/app/mensajes");
  return { ok: true };
}

/** C14: manda un set a un grupo de fans. Devuelve a cuántos les llegó. */
export async function enviarSet(
  setId: string,
  grupo: "compradores" | "suscriptores" | "seguidores",
  texto: string,
): Promise<{ ok: true; enviados: number } | { ok: false; error: string }> {
  if (!ID_MEDIO.test(setId)) return { ok: false, error: ERRORES_MENSAJE.set_no_disponible };
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  // Un margen por si el reloj del servidor y el de la base no coinciden.
  const desde = new Date(Date.now() - 60_000).toISOString();
  const supabase = await supabaseServidor();
  const { data, error: e } = await supabase.rpc("enviar_set_a_fans", { p_set: setId, p_grupo: grupo, p_texto: (texto.trim() || null) as string });
  if (e) {
    const r = error(e.message);
    if (r && !r.ok) return r;
    throw e;
  }
  if (data > 0) after(() => avisarEnvio(creadora.id, setId, desde));
  revalidatePath("/app/mensajes");
  return { ok: true, enviados: data };
}

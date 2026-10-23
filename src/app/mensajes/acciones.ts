"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { Database } from "@/lib/database.types";
import { ERRORES_MENSAJE } from "@/lib/mensajes";
import { ID_MEDIO } from "@/lib/medios";
import { avisarMensaje } from "@/server/correo";
import { fanActual } from "@/server/fan";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true } | { ok: false; error: string };
type Motivo = Database["public"]["Enums"]["motivo_reporte"];

/** F8: el fan le escribe a una creadora (abre la conversación si no existía). */
export async function escribirACreadora(creadoraId: string, texto: string): Promise<Resultado & { conversacion?: string }> {
  if (!ID_MEDIO.test(creadoraId)) return { ok: false, error: "No encontramos a esta creadora." };
  if (!(await fanActual())) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo; tu mensaje no se envió." };
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("escribir_a_creadora", { p_creadora: creadoraId, p_texto: texto });
  if (error) {
    const t = ERRORES_MENSAJE[error.message];
    if (t) return { ok: false, error: t };
    throw error;
  }
  after(() => avisarMensaje(data, "creadora"));
  revalidatePath("/mensajes");
  return { ok: true, conversacion: data };
}

/** Cualquiera de los dos reporta una conversación. Solo así la puede leer el equipo. */
export async function reportarConversacion(conversacionId: string, motivo: Motivo, detalle: string): Promise<Resultado & { folio?: string }> {
  if (!ID_MEDIO.test(conversacionId)) return { ok: false, error: "No encontramos esta conversación." };
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("reportar_conversacion", {
    p_conversacion: conversacionId,
    p_motivo: motivo,
    p_detalle: detalle.slice(0, 1000),
  });
  if (error) {
    const t = ERRORES_MENSAJE[error.message];
    if (t) return { ok: false, error: t };
    throw error;
  }
  return { ok: true, folio: data };
}

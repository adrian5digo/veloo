"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { ID_MEDIO } from "@/lib/medios";
import { intentoCompleto, prepararIntento, rutaIdentidad, type Pieza } from "@/server/identidad";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin } from "@/server/supabase";

/** C2: links para subir INE frente, reverso y selfie directo a storage. */
export async function iniciarIntento(): Promise<{ ok: true; intentoId: string; urls: Record<Pieza, string> } | { ok: false; error: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo con tu correo." };
  const intentoId = randomUUID();
  return { ok: true, intentoId, urls: await prepararIntento(creadora.id, intentoId) };
}

/** C2 → C2c: las 3 fotos subieron; queda en revisión manual. */
export async function terminarIntento(intentoId: string): Promise<{ error: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { error: "Tu sesión se cerró. Entra de nuevo; vas a tener que tomar las fotos otra vez." };
  if (!ID_MEDIO.test(intentoId)) return { error: "Vuelve a empezar la verificación." };
  if (!(await intentoCompleto(creadora.id, intentoId))) {
    return { error: "Alguna foto no terminó de subir. Revisa tu conexión y tómala otra vez." };
  }

  // La creadora no escribe en verificaciones: el intento lo crea el servidor.
  const { error } = await supabaseAdmin()
    .from("verificaciones")
    .insert({
      id: intentoId,
      creadora_id: creadora.id,
      estado: "pendiente",
      proveedor: "manual",
      ine_frente_path: rutaIdentidad(creadora.id, intentoId, "ine_frente"),
      ine_reverso_path: rutaIdentidad(creadora.id, intentoId, "ine_reverso"),
      selfie_path: rutaIdentidad(creadora.id, intentoId, "selfie"),
    });
  if (error) throw error;
  redirect("/app/verificacion");
}

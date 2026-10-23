"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { ID_MEDIO } from "@/lib/medios";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true } | { ok: false; error: string };

// Límite simple por IP en memoria del servidor: frena a quien llena la lista con correos falsos.
const intentos = new Map<string, number[]>();

function demasiados(ip: string) {
  const ahora = Date.now();
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < 3600_000);
  recientes.push(ahora);
  intentos.set(ip, recientes);
  return recientes.length > 10;
}

/** F1 · "Avísame": deja el correo para enterarse del próximo set. Sin cuenta. */
export async function pedirAviso(creadoraId: string, correo: string): Promise<Resultado> {
  if (!ID_MEDIO.test(creadoraId)) return { ok: false, error: "No encontramos esta página." };
  const limpio = correo.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio)) return { ok: false, error: "Revisa tu correo: le falta algo." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (demasiados(createHash("sha256").update(ip).digest("hex"))) {
    return { ok: false, error: "Ya mandaste varios correos. Intenta en una hora; los anteriores sí quedaron." };
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("pedir_aviso", { p_creadora: creadoraId, p_correo: limpio });
  if (error) {
    if (error.message === "correo_invalido") return { ok: false, error: "Revisa tu correo: le falta algo." };
    if (error.message === "creadora_no_disponible") return { ok: false, error: "Esta página ya no está disponible." };
    throw error;
  }
  return { ok: true };
}

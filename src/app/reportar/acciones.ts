"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { Database } from "@/lib/database.types";
import { ID_MEDIO } from "@/lib/medios";
import { supabaseAdmin } from "@/server/supabase";

export type MotivoReporte = Database["public"]["Enums"]["motivo_reporte"];

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_POR_HORA = 5;

/**
 * R1: se puede reportar sin cuenta. Lo inserta el servidor y limita por IP (solo se guarda el hash).
 * Los urgentes ocultan el set al instante (trigger procesar_reporte).
 */
export async function enviarReporte(datos: {
  setId?: string;
  usuario?: string;
  motivo: MotivoReporte;
  correo: string;
}): Promise<{ ok: true; folio: string } | { ok: false; error: string }> {
  const correo = datos.correo.trim().toLowerCase();
  if (correo && !CORREO.test(correo)) return { ok: false, error: "Revisa el correo, o déjalo vacío." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "sin-ip";
  const ipHash = createHash("sha256").update(`${process.env.SUPABASE_SECRET_KEY ?? ""}:${ip}`).digest("hex");

  const db = supabaseAdmin();
  const { count } = await db
    .from("reportes")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gt("creado_en", new Date(Date.now() - 3600_000).toISOString());
  if ((count ?? 0) >= MAX_POR_HORA) {
    return { ok: false, error: "Ya mandaste varios reportes. Espera una hora; los anteriores sí nos llegaron." };
  }

  let creadoraId: string | null = null;
  if (!datos.setId && datos.usuario) {
    const { data } = await db.from("creadoras").select("id").eq("usuario", datos.usuario).maybeSingle();
    creadoraId = data?.id ?? null;
  }

  const { data, error } = await db
    .from("reportes")
    .insert({
      set_id: datos.setId && ID_MEDIO.test(datos.setId) ? datos.setId : null,
      creadora_id: creadoraId,
      motivo: datos.motivo,
      correo_contacto: correo || null,
      ip_hash: ipHash,
    })
    .select("folio")
    .single();
  if (error) throw error;
  return { ok: true, folio: data.folio };
}

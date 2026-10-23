"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { hashToken } from "@/server/pagos";
import { registrarAcceso, staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";

/**
 * SPEI manual: alguien del equipo vio la transferencia con ese concepto en la banca.
 * Crea el acceso del fan y la venta de la creadora (retenida 7 días), igual que un webhook.
 */
export async function confirmarRecibido(ordenId: string): Promise<{ error?: string }> {
  const staff = await staffActual();
  if (!staff) return { error: "Tu sesión se cerró. Entra de nuevo." };
  if (!ID_MEDIO.test(ordenId)) return { error: "No encontramos esa orden." };

  // El link permanente (/acceso/[token]) no se puede mandar sin correo transaccional:
  // el fan entra por Mis compras con su correo. Aquí solo se guarda el hash.
  const hash = hashToken(randomBytes(32).toString("base64url"));
  const { error } = await supabaseAdmin().rpc("confirmar_spei_manual", { p_orden: ordenId, p_staff: staff.id, p_token_hash: hash });
  if (error) {
    if (error.message === "orden_no_pagable") return { error: "Esa orden ya no se puede confirmar (fue reembolsada o rechazada)." };
    if (error.message === "orden_no_es_spei_manual") return { error: "Esa orden no es de transferencia manual." };
    throw error;
  }
  await registrarAcceso(staff.id, "confirmar_spei_manual", "orden", ordenId);
  revalidatePath("/panel", "layout");
  return {};
}

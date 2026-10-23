"use server";

import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";

/** A4: "Sin falta" restaura el set si el reporte lo había ocultado; "Quitar set" lo deja oculto. */
export async function resolver(reporteId: string, estado: "sin_falta" | "set_quitado"): Promise<{ error?: string }> {
  const staff = await staffActual();
  if (!staff) return { error: "Tu sesión se cerró. Entra de nuevo." };
  if (!ID_MEDIO.test(reporteId)) return { error: "No encontramos ese reporte." };
  const { error } = await supabaseAdmin().rpc("resolver_reporte", { p_reporte: reporteId, p_staff: staff.id, p_estado: estado });
  if (error) {
    if (error.message === "reporte_no_abierto") return { error: "Alguien más ya lo resolvió." };
    throw error;
  }
  revalidatePath("/panel", "layout");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { avisarSetNuevo } from "@/server/correo";
import { ID_MEDIO } from "@/lib/medios";
import { staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";

const ERRORES: Record<string, string> = {
  set_no_en_moderacion: "Este set ya no está en la cola: alguien más lo decidió o la creadora lo retiró.",
  creadora_no_verificada: "La creadora todavía no está verificada. Apruébala en Verificaciones primero.",
  faltan_firmas: "Alguien aparece sin firmar. No se puede aprobar hasta que firme.",
  motivo_invalido: "Elige un motivo de la lista.",
};

export async function decidir(
  setId: string,
  decision: "aprobado" | "rechazado",
  motivo?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await staffActual();
  if (!staff) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo." };
  if (!ID_MEDIO.test(setId)) return { ok: false, error: "No encontramos ese set." };

  const { error } = await supabaseAdmin().rpc("moderar_set", {
    p_set: setId,
    p_staff: staff.id,
    p_decision: decision,
    p_motivo: decision === "rechazado" ? motivo : undefined,
  });
  if (error) {
    const conocido = ERRORES[error.message];
    if (conocido) return { ok: false, error: conocido };
    throw error;
  }
  // Set publicado: avisa por correo a su lista de aviso y a sus seguidores (una sola vez).
  if (decision === "aprobado") after(() => avisarSetNuevo(setId));
  revalidatePath("/panel", "layout");
  return { ok: true };
}

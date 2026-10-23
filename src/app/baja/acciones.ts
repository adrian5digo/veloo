"use server";

import { ID_MEDIO } from "@/lib/medios";
import { bajaValida } from "@/server/correo";
import { supabaseAdmin } from "@/server/supabase";

/** Deja de mandarle avisos de esa creadora. Solo con el link firmado que llegó en el correo. */
export async function confirmarBaja(correo: string, creadoraId: string, token: string): Promise<{ ok: boolean }> {
  if (!ID_MEDIO.test(creadoraId) || !bajaValida(correo, creadoraId, token)) return { ok: false };
  const { error } = await supabaseAdmin().rpc("dar_de_baja", { p_correo: correo, p_creadora: creadoraId });
  if (error) throw error;
  return { ok: true };
}

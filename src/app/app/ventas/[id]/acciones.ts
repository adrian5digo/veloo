"use server";

import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";

/** C11: bloquea (o desbloquea) al fan de esta venta. Va por correo; la creadora nunca lo ve completo. */
export async function cambiarBloqueo(ordenId: string, bloquear: boolean): Promise<{ error?: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { error: "Tu sesión se cerró. Entra de nuevo." };
  if (!ID_MEDIO.test(ordenId)) return { error: "No encontramos esa venta." };
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc(bloquear ? "bloquear_fan" : "desbloquear_fan", { p_orden: ordenId });
  if (error) {
    if (error.message === "orden_no_encontrada") return { error: "No encontramos esa venta." };
    throw error;
  }
  revalidatePath(`/app/ventas/${ordenId}`);
  return {};
}

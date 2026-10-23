"use server";

import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";

/**
 * Decisión manual mientras no hay proveedor de identidad (INE + prueba de vida).
 * El trigger sincronizar_verificacion() actualiza el estado de la creadora.
 */
export async function decidirCreadora(
  creadoraId: string,
  estado: "aprobada" | "rechazada" | "pide_otra_foto",
  motivo: string,
  /** Nombre como aparece en la INE. Obligatorio al aprobar: es el titular de su CLABE (C10). */
  nombreLegal?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await staffActual();
  if (!staff) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo." };
  if (!ID_MEDIO.test(creadoraId)) return { ok: false, error: "No encontramos a esa creadora." };
  if (!motivo.trim()) return { ok: false, error: "Escribe cómo la verificaste o por qué no." };

  const nombre = nombreLegal?.trim().replace(/\s+/g, " ") ?? "";
  if (estado === "aprobada" && nombre.split(" ").length < 2) {
    return { ok: false, error: "Escribe su nombre completo como aparece en la INE." };
  }

  const db = supabaseAdmin();
  if (estado === "aprobada") {
    const { error } = await db.from("creadoras_privado").upsert({ id: creadoraId, nombre_legal: nombre }, { onConflict: "id" });
    if (error) throw error;
  }
  const decision = { estado, motivo: motivo.trim(), decidida_por: staff.id, decidida_en: new Date().toISOString() };
  // Si subió INE y selfie (C2), se decide ese intento; si no, se crea uno ya decidido.
  const { data: pendiente } = await db
    .from("verificaciones")
    .select("id")
    .eq("creadora_id", creadoraId)
    .eq("estado", "pendiente")
    .order("creada_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = pendiente
    ? await db.from("verificaciones").update(decision).eq("id", pendiente.id)
    : await db.from("verificaciones").insert({ creadora_id: creadoraId, proveedor: "manual", ...decision });
  if (error) throw error;
  revalidatePath("/panel", "layout");
  return { ok: true };
}

import "server-only";
import type { Database } from "@/lib/database.types";
import { supabaseAdmin, supabaseServidor } from "./supabase";

export type Staff = { id: string; nombre: string; rol: Database["public"]["Enums"]["rol_staff"] };

/** Persona del equipo con sesión iniciada, o null si no hay sesión o no es del equipo. */
export async function staffActual(): Promise<Staff | null> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabaseAdmin().from("staff").select("id, nombre, rol").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Deja constancia de lo que el equipo abre sin velo o con datos de identidad (A1, A2). */
export async function registrarAcceso(staffId: string, accion: string, recursoTipo: string, recursoId: string) {
  const { error } = await supabaseAdmin()
    .from("registro_staff")
    .insert({ staff_id: staffId, accion, recurso_tipo: recursoTipo, recurso_id: recursoId });
  if (error) throw error;
}

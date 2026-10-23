import "server-only";
import { supabaseServidor } from "./supabase";

export type Creadora = { id: string; correo: string };

/**
 * Creadora con sesión iniciada, o null.
 * Entrar a la app de la creadora crea su perfil vacío; el registro (C1b) lo completa después.
 */
export async function creadoraActual(): Promise<Creadora | null> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase.from("creadoras").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`No se pudo crear el perfil de creadora: ${error.message}`);
  return { id: user.id, correo: user.email ?? "" };
}

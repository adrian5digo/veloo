import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "./supabase";

/** Excepción del piloto, solo para las cuentas habilitadas por el propietario en servidor. */
export const cobroDirectoPiloto = cache(async (creadoraId: string) => {
  const { data, error } = await supabaseAdmin().from("creadoras_prueba").select("activa").eq("creadora_id", creadoraId).maybeSingle();
  if (error) throw error;
  return data?.activa === true;
});

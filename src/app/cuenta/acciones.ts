"use server";

import { headers } from "next/headers";
import { hashToken } from "@/server/pagos";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

/**
 * L3: la cuenta se crea con el correo de la compra (se toma del acceso, no de lo que mande el navegador).
 * Manda el link de entrada; al abrirlo, /cuenta/listo guarda el nombre y el "seguir".
 */
export async function crearCuenta(datos: { acceso: string; nombre: string; seguir: boolean }): Promise<{ ok: true; correo: string } | { ok: false; error: string }> {
  const db = supabaseAdmin();
  const { data: acceso } = await db.from("accesos").select("correo, sets(creadora_id)").eq("token_hash", hashToken(datos.acceso)).maybeSingle();
  if (!acceso) return { ok: false, error: "Este link de compra ya no sirve. Abre el más reciente de tu correo." };

  const nombre = datos.nombre.trim().slice(0, 40);
  const params = new URLSearchParams();
  if (nombre) params.set("nombre", nombre);
  if (datos.seguir && acceso.sets?.creadora_id) params.set("seguir", acceso.sets.creadora_id);
  const siguiente = `/cuenta/listo${params.size ? `?${params}` : ""}`;

  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "";
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email: acceso.correo,
    options: { shouldCreateUser: true, emailRedirectTo: `${origen}/auth/confirmar?siguiente=${encodeURIComponent(siguiente)}` },
  });
  if (error) {
    return { ok: false, error: error.status === 429 ? "Pediste varios correos seguidos. Espera un minuto." : "No pudimos mandar el correo. Vuelve a intentar." };
  }
  return { ok: true, correo: acceso.correo };
}

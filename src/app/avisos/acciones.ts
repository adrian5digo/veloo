"use server";

import { supabaseServidor } from "@/server/supabase";

/** P3: guarda la suscripción de avisos del navegador (RLS: solo las propias). */
export async function guardarSuscripcion(s: { endpoint: string; p256dh: string; auth: string }): Promise<{ error?: string }> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entra con tu correo para activar los avisos." };
  if (!s.endpoint.startsWith("https://")) return { error: "Este navegador no permite avisos." };
  const { error } = await supabase
    .from("suscripciones_push")
    .upsert({ usuario_id: user.id, endpoint: s.endpoint, p256dh: s.p256dh, auth_clave: s.auth }, { onConflict: "endpoint" });
  if (error) throw error;
  return {};
}

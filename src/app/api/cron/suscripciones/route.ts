import { timingSafeEqual } from "node:crypto";
import { avisarSuscripcionDetenida } from "@/server/correo";
import { supabaseAdmin } from "@/server/supabase";

/**
 * Cron diario (vercel.json): renueva las suscripciones que vencieron, cobrando del saldo de tokens.
 * Si al fan no le alcanza, la suscripción se detiene sin cobrar. Vercel manda CRON_SECRET como Bearer.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  const recibido = request.headers.get("authorization") ?? "";
  const esperado = `Bearer ${secreto}`;
  if (!secreto || recibido.length !== esperado.length || !timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado))) {
    return new Response(null, { status: 401 });
  }
  const db = supabaseAdmin();
  const inicio = new Date(Date.now() - 60_000).toISOString();
  const { data, error } = await db.rpc("renovar_suscripciones");
  if (error) throw error;

  // Avisa a quien se le detuvo por falta de tokens en esta corrida.
  const { data: detenidas } = await db
    .from("suscripciones")
    .select("fan_id, creadora_id, tokens")
    .eq("fin_motivo", "sin_saldo")
    .gte("actualizado_en", inicio);
  for (const s of detenidas ?? []) await avisarSuscripcionDetenida(s.fan_id, s.creadora_id, s.tokens);

  return Response.json({ renovadas: data, detenidas: detenidas?.length ?? 0 });
}

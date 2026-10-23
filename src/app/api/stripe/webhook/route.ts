import { after } from "next/server";
import type Stripe from "stripe";
import { avisarTokens } from "@/server/correo";
import { stripe, stripeEnVivo } from "@/server/stripe";
import { supabaseAdmin } from "@/server/supabase";
import { confirmarSesionDirecta } from "@/server/pago-directo";

/**
 * Webhook de Stripe. Cada evento se guarda una sola vez (eventos_pago) y se procesa de forma idempotente.
 * - checkout.session.completed con payment_status "paid" (tarjeta) → acredita.
 * - checkout.session.async_payment_succeeded (OXXO pagado en tienda) → acredita.
 * - async_payment_failed / expired → la compra queda fallida; no se cobró.
 */
export async function POST(req: Request) {
  const firma = req.headers.get("stripe-signature");
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!firma || !secreto) return new Response("sin firma", { status: 400 });

  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(await req.text(), firma, secreto);
  } catch {
    return new Response("firma inválida", { status: 400 });
  }

  if (evento.livemode !== stripeEnVivo()) return new Response("modo incorrecto", { status: 400 });
  if (evento.type.startsWith("checkout.session.") && (evento.data.object as Stripe.Checkout.Session).livemode !== stripeEnVivo()) return new Response("modo incorrecto", { status: 400 });

  const db = supabaseAdmin();
  const { data: guardado, error } = await db
    .from("eventos_pago")
    .upsert(
      { procesador: "stripe", evento_id: evento.id, tipo: evento.type, payload: JSON.parse(JSON.stringify(evento)) },
      { onConflict: "procesador,evento_id", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw error;
  // Stripe reintenta: si ya lo teníamos, no se procesa otra vez.
  let registroId = guardado?.[0]?.id;
  if (!registroId) {
    const { data: existente, error: e2 } = await db.from("eventos_pago").select("id, procesado_en").eq("procesador", "stripe").eq("evento_id", evento.id).single();
    if (e2) throw e2;
    if (existente.procesado_en) return Response.json({ recibido: true, repetido: true });
    registroId = existente.id;
  }

  if (evento.type.startsWith("checkout.session.")) {
    const sesion = evento.data.object as Stripe.Checkout.Session;
    const compraId = sesion.metadata?.compra_id;
    if (compraId && !stripeEnVivo()) await procesarSesion(evento.type, sesion, compraId);
    if (sesion.metadata?.tipo === "set_directo") {
      if (evento.type === "checkout.session.completed" || evento.type === "checkout.session.async_payment_succeeded") await confirmarSesionDirecta(sesion);
      if (evento.type === "checkout.session.expired" || evento.type === "checkout.session.async_payment_failed") {
        const { error: fallo } = await db.from("ordenes").update({ estado: "vencida" }).eq("procesador", "stripe_directo").eq("procesador_ref", sesion.id).eq("estado", "pendiente");
        if (fallo) throw fallo;
      }
    }
  }

  const { error: procesadoError } = await db.from("eventos_pago").update({ procesado_en: new Date().toISOString() }).eq("id", registroId);
  if (procesadoError) throw procesadoError;
  return Response.json({ recibido: true });
}

async function procesarSesion(tipo: Stripe.Event.Type, sesion: Stripe.Checkout.Session, compraId: string) {
  const db = supabaseAdmin();
  const { data: compra } = await db.from("compras_tokens").select("id, precio_centavos, procesador_ref").eq("id", compraId).maybeSingle();
  // La sesión tiene que ser la de esta compra y por el monto exacto; si no, no se acredita nada.
  if (!compra || compra.procesador_ref !== sesion.id || sesion.amount_total !== compra.precio_centavos || sesion.currency !== "mxn") return;

  const pagada =
    (tipo === "checkout.session.completed" && sesion.payment_status === "paid") || tipo === "checkout.session.async_payment_succeeded";
  if (pagada) {
    const { data: nueva, error } = await db.rpc("acreditar_tokens", { p_compra: compra.id });
    if (error) throw error;
    if (nueva) after(() => avisarTokens(compra.id));
    return;
  }
  if (tipo === "checkout.session.async_payment_failed" || tipo === "checkout.session.expired") {
    await db.from("compras_tokens").update({ estado: "fallida" }).eq("id", compra.id).eq("estado", "pendiente");
  }
}

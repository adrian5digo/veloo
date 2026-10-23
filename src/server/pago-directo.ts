import "server-only";
import type Stripe from "stripe";
import { sesionDirectaValida } from "@/lib/pago-directo";
import { supabaseAdmin } from "./supabase";
import { stripeEnVivo } from "./stripe";

/** La misma confirmación idempotente funciona desde el webhook y el regreso autenticado por Stripe. */
export async function confirmarSesionDirecta(sesion: Stripe.Checkout.Session) {
  const ordenId = sesion.metadata?.orden_id;
  if (!ordenId || !/^[a-f0-9-]{36}$/.test(ordenId)) return false;
  const db = supabaseAdmin();
  const { data: orden, error } = await db.from("ordenes").select("id, procesador, procesador_ref, precio_centavos, correo, estado").eq("id", ordenId).maybeSingle();
  if (error) throw error;
  if (!orden || !sesionDirectaValida(sesion, orden, stripeEnVivo()) || sesion.payment_status !== "paid") return false;
  if (orden.estado !== "pendiente" && orden.estado !== "pagada") return false;
  const { error: pagoError } = await db.rpc("confirmar_pago", { p_orden: orden.id, p_token_hash: sesion.metadata!.acceso_hash });
  if (pagoError) throw pagoError;
  return true;
}

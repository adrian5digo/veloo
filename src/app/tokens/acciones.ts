"use server";

import { headers } from "next/headers";
import { destinoSeguro } from "@/lib/destino";
import { asegurarFan, fanActual, mayorDeEdad } from "@/server/fan";
import { esPaquete, stripe, stripeListo } from "@/server/stripe";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true; ir: string } | { ok: false; error: string };

/**
 * Crea la compra pendiente y la sesión de Stripe Checkout. Los métodos (tarjeta, OXXO) se activan
 * en el Dashboard de Stripe, no aquí.
 * Los tokens se acreditan solo cuando llega el webhook: volver de Stripe no prueba que se pagó.
 */
export async function comprarTokens(tokens: number, para: string, confirmaEdad: boolean): Promise<Resultado> {
  const fan = await fanActual();
  if (!fan) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo; no se te cobró nada." };
  if (!esPaquete(tokens)) return { ok: false, error: "Ese paquete no existe. No se te cobró nada." };
  if (!stripeListo()) return { ok: false, error: "Todavía no podemos cobrar. No se te cobró nada; vuelve pronto." };

  await asegurarFan(fan.id);
  // Solo mayores de 18: se confirma una vez y queda en la cuenta con la fecha.
  if (!(await mayorDeEdad(fan.id))) {
    if (!confirmaEdad) return { ok: false, error: "Confirma que tienes 18 años o más para comprar tokens." };
    const { error } = await (await supabaseServidor()).rpc("confirmar_mayoria_edad");
    if (error) throw error;
  }
  const db = supabaseAdmin();
  const { data: compra, error } = await db
    .from("compras_tokens")
    .insert({ fan_id: fan.id, tokens, precio_centavos: tokens * 100, procesador: "stripe" })
    .select("id")
    .single();
  if (error) throw error;

  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "";
  const regreso = `${origen}/tokens?compra=${compra.id}${para ? `&para=${encodeURIComponent(destinoSeguro(para, "/mis-compras"))}` : ""}`;
  const sesion = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: fan.correo,
    client_reference_id: compra.id,
    metadata: { compra_id: compra.id },
    payment_intent_data: { metadata: { compra_id: compra.id } },
    payment_method_options: { oxxo: { expires_after_days: 3 } },
    line_items: [{ quantity: 1, price_data: { currency: "mxn", unit_amount: tokens * 100, product_data: { name: `${tokens} tokens de Veloo` } } }],
    success_url: regreso,
    cancel_url: `${origen}/tokens${para ? `?para=${encodeURIComponent(destinoSeguro(para, "/mis-compras"))}` : ""}`,
  });

  const { error: e2 } = await db.from("compras_tokens").update({ procesador_ref: sesion.id }).eq("id", compra.id);
  if (e2) throw e2;
  if (!sesion.url) return { ok: false, error: "Stripe no respondió. No se te cobró nada; intenta de nuevo." };
  return { ok: true, ir: sesion.url };
}

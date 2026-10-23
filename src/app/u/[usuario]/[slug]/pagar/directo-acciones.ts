"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { ID_MEDIO } from "@/lib/medios";
import { fanActual } from "@/server/fan";
import { COMISION, hashToken } from "@/server/pagos";
import { cobroDirectoPiloto } from "@/server/piloto";
import { bloqueadoPorPais } from "@/server/publico";
import { stripe, stripeListo } from "@/server/stripe";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

export async function pagarDirecto(setId: string, correoEntrada: string, confirmaEdad: boolean): Promise<{ ok: true; ir: string } | { ok: false; error: string }> {
  const correo = correoEntrada.trim().toLowerCase();
  if (!ID_MEDIO.test(setId) || correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { ok: false, error: "Revisa tu correo antes de continuar." };
  if (confirmaEdad !== true) return { ok: false, error: "Confirma que tienes 18 años o más para comprar." };
  if (!stripeListo(true)) return { ok: false, error: "El pago no está disponible. No se te cobró nada; intenta más tarde." };
  const supabase = await supabaseServidor();
  const { data: set, error } = await supabase.from("sets").select("id, titulo, creadora_id, precio_centavos, slug, creadoras(usuario)").eq("id", setId).eq("estado", "publicado").maybeSingle();
  if (error) throw error;
  if (!set?.creadoras?.usuario || set.precio_centavos <= 0 || !(await cobroDirectoPiloto(set.creadora_id)) || (await bloqueadoPorPais(set.creadora_id))) return { ok: false, error: "Este set no está disponible para pago directo. No se te cobró nada." };
  const db = supabaseAdmin();
  const { data: bloqueado, error: bloqueoError } = await db.rpc("esta_bloqueado", { p_creadora: set.creadora_id, p_correo: correo });
  if (bloqueoError) throw bloqueoError;
  if (bloqueado) return { ok: false, error: "No es posible comprar este set con este correo." };
  const fan = await fanActual();
  if (fan?.correo === correo) {
    const { data: compra, error: compraError } = await supabase.from("mis_compras").select("id").eq("set_id", set.id).eq("estado", "pagada").limit(1).maybeSingle();
    if (compraError) throw compraError;
    if (compra) return { ok: true, ir: `/mis-compras/${compra.id}` };
  }
  const pais = (await headers()).get("x-vercel-ip-country");
  const { data: orden, error: ordenError } = await db.from("ordenes").insert({ set_id: set.id, creadora_id: set.creadora_id, correo, metodo: "tarjeta", precio_centavos: set.precio_centavos, comision_centavos: Math.round(set.precio_centavos * COMISION), procesador: "stripe_directo", pais: pais && /^[A-Z]{2}$/.test(pais) ? pais : null }).select("id").single();
  if (ordenError) throw ordenError;
  // El token solo queda en una cookie httpOnly del comprador; Stripe y la base guardan su hash.
  const token = randomBytes(32).toString("base64url");
  const origen = new URL(process.env.NEXT_PUBLIC_SITIO_URL || "http://localhost:3100").origin;
  const volver = `/u/${set.creadoras.usuario}/${set.slug}/pagar`;
  try {
    const sesion = await stripe().checkout.sessions.create({
      mode: "payment", allowed_payment_method_types: ["card"], customer_email: correo, client_reference_id: orden.id,
      branding_settings: { display_name: "Veloo" },
      wallet_options: { link: { display: "never" } },
      metadata: { tipo: "set_directo", orden_id: orden.id, acceso_hash: hashToken(token), mayor_edad: "si", edad_confirmada_en: new Date().toISOString() },
      payment_intent_data: { metadata: { orden_id: orden.id, tipo: "set_directo" } },
      line_items: [{ quantity: 1, price_data: { currency: "mxn", unit_amount: set.precio_centavos, product_data: { name: "Veloo" } } }],
      success_url: `${origen}/orden/pago?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origen}${volver}?cancelado=1`,
    }, { idempotencyKey: `set-directo-${orden.id}` });
    const { error: refError } = await db.from("ordenes").update({ procesador_ref: sesion.id }).eq("id", orden.id);
    if (refError) throw refError;
    if (!sesion.url) throw new Error("checkout_sin_url");
    (await cookies()).set(`veloo_pago_${orden.id}`, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/orden/pago", maxAge: 86400 });
    return { ok: true, ir: sesion.url };
  } catch {
    // La orden conserva su referencia si Stripe alcanzó a crear la sesión; nunca se marca pagada aquí.
    return { ok: false, error: "No pudimos abrir el pago. Intenta de nuevo; si ves un cargo, revisa Mis compras antes de repetirlo." };
  }
}

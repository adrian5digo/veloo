import "server-only";
import Stripe from "stripe";

/**
 * Stripe: paquetes de tokens y pago directo por set para la creadora habilitada en el piloto.
 *
 * El pago directo del piloto admite llaves de prueba y reales. Los paquetes de tokens
 * permanecen en prueba hasta confirmar su modelo de operación.
 */

let cliente: Stripe | null = null;

export function stripeEnVivo() {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
}

export function stripeListo(directo = false) {
  const llave = process.env.STRIPE_SECRET_KEY ?? "";
  return (llave.startsWith("sk_test_") || (directo && stripeEnVivo())) && !!process.env.STRIPE_WEBHOOK_SECRET;
}

export function stripe() {
  const llave = process.env.STRIPE_SECRET_KEY ?? "";
  if (!/^sk_(test|live)_\S+$/.test(llave)) throw new Error("Configura STRIPE_SECRET_KEY con una llave válida de Stripe");
  cliente ??= new Stripe(llave);
  return cliente;
}

/** 1 token = $1 MXN. */
export const PAQUETES = [100, 250, 500] as const;
export type Paquete = (typeof PAQUETES)[number];
export const esPaquete = (n: number): n is Paquete => (PAQUETES as readonly number[]).includes(n);

/** Tokens que cuesta un set: su precio en pesos, redondeado hacia arriba. */
export const tokensDe = (precioCentavos: number) => Math.ceil(precioCentavos / 100);

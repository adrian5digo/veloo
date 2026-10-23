import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { clabeValida } from "@/lib/clabe";
import type { Database } from "@/lib/database.types";
import { supabaseAdmin } from "./supabase";

/**
 * Pagos (F4–F7). El procesador real todavía no está decidido (OXXO + SPEI + tarjeta con 3-D Secure).
 * Todo pasa por la interfaz `Procesador`. Mientras tanto hay dos:
 * - "simulado": SOLO fuera de producción y con PAGOS_SIMULADOS=1, para probar el flujo sin cobrar.
 * - "spei_manual": transferencia a la CLABE de Veloo (SPEI_CLABE) con un concepto único por compra.
 *   El equipo confirma cada pago a mano en /panel/pagos. Sirve para validar con dinero real.
 *
 * Nunca se mandan números de tarjeta a este servidor: con el procesador real, la tarjeta se
 * captura en sus campos (iframe) y aquí solo llega un token.
 */

/** Los tokens no pasan por un procesador: se descuentan del saldo del fan. */
export type Metodo = Exclude<Database["public"]["Enums"]["metodo_pago"], "tokens">;

export type Cargo =
  | { metodo: "tarjeta"; aprobado: boolean; ref: string }
  | { metodo: "oxxo"; ref: string; referencia: string; venceEn: string }
  | { metodo: "spei"; ref: string; clabe: string; referencia: string; venceEn: string };

export interface Procesador {
  nombre: string;
  /** Métodos que se ofrecen en el checkout, en orden. */
  metodos: Metodo[];
  /** `tokenTarjeta` lo genera el procesador en el navegador; nunca el número. */
  crearCargo(orden: { id: string; centavos: number; correo: string; metodo: Metodo; tokenTarjeta?: string }): Promise<Cargo>;
}

const SETENTA_Y_DOS_HORAS = 72 * 3600_000;

/** CLABE válida de STP (646) para el simulador: 17 dígitos + dígito de control. */
function clabeSimulada() {
  const base = `646180${Array.from({ length: 11 }, () => randomInt(10)).join("")}`;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(base[i]) * pesos[i % 3]) % 10;
  return base + ((10 - (suma % 10)) % 10);
}

const simulado: Procesador = {
  nombre: "simulado",
  metodos: ["tarjeta", "oxxo", "spei"],
  async crearCargo({ id, metodo, tokenTarjeta }) {
    const ref = `sim_${id.slice(0, 8)}_${randomBytes(3).toString("hex")}`;
    const venceEn = new Date(Date.now() + SETENTA_Y_DOS_HORAS).toISOString();
    if (metodo === "tarjeta") return { metodo, ref, aprobado: tokenTarjeta !== "rechazar" };
    if (metodo === "oxxo") return { metodo, ref, venceEn, referencia: Array.from({ length: 16 }, () => randomInt(10)).join("") };
    return { metodo, ref, venceEn, clabe: clabeSimulada(), referencia: String(randomInt(1_000_000, 9_999_999)) };
  },
};

/** Sin 0/O, 1/I/L: se dicta y se escribe en la app del banco sin confundirse. */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** "VLO7KQ4M": cabe en el concepto de cualquier banco (máx. 40) y se busca fácil en la banca. */
export const conceptoNuevo = () => `VLO${Array.from({ length: 5 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("")}`;

/** La cuenta de Veloo para SPEI manual, o null si falta configurarla. */
export function cuentaSpeiManual(): { clabe: string; titular: string } | null {
  const clabe = process.env.SPEI_CLABE?.replace(/\s/g, "") ?? "";
  const titular = process.env.SPEI_TITULAR?.trim() ?? "";
  return clabeValida(clabe) && titular ? { clabe, titular } : null;
}

const speiManual: Procesador = {
  nombre: "spei_manual",
  metodos: ["spei"],
  async crearCargo({ id }) {
    const cuenta = cuentaSpeiManual()!;
    const venceEn = new Date(Date.now() + SETENTA_Y_DOS_HORAS).toISOString();
    return { metodo: "spei", ref: `man_${id}`, venceEn, clabe: cuenta.clabe, referencia: conceptoNuevo() };
  },
};

export const pagosSimulados = () => process.env.NODE_ENV !== "production" && process.env.PAGOS_SIMULADOS === "1";

/** El procesador activo, o null si todavía no se puede cobrar. */
export function procesador(): Procesador | null {
  if (pagosSimulados()) return simulado;
  return cuentaSpeiManual() ? speiManual : null;
}

export { COMISION } from "@/lib/dinero";

/**
 * Confirma una orden pagada (lo llama el webhook del procesador). Idempotente.
 * Crea el acceso permanente y devuelve el token (solo se guarda su hash).
 */
export async function confirmarOrden(ordenId: string): Promise<string | null> {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: nueva, error } = await supabaseAdmin().rpc("confirmar_pago", { p_orden: ordenId, p_token_hash: hash });
  if (error) throw error;
  // Si ya estaba pagada, el token anterior sigue siendo el bueno: este no se guardó.
  return nueva ? token : null;
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

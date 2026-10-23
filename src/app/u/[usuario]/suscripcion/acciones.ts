"use server";

import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { asegurarFan, fanActual } from "@/server/fan";
import { bloqueadoPorPais } from "@/server/publico";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true; hasta: string } | { ok: false; error: string; faltan?: boolean };

const ERRORES: Record<string, string> = {
  saldo_insuficiente: "No te alcanzan los tokens. No se descontó nada.",
  fan_bloqueado: "No es posible suscribirte con esta cuenta.",
  suscripcion_no_disponible: "Esta creadora ya no ofrece suscripción. No se descontó nada.",
  suscripcion_propia: "No puedes suscribirte a tu propia página.",
  falta_mayoria_edad: "Confirma que tienes 18 años o más para continuar.",
  sin_suscripcion: "No encontramos tu suscripción.",
};

function traducir(mensaje: string, extra?: object): Resultado | null {
  const texto = ERRORES[mensaje];
  return texto ? { ok: false, error: texto, ...extra } : null;
}

/** F9: se suscribe con su saldo (o reactiva la renovación si ya estaba activa). */
export async function suscribir(creadoraId: string, confirmaEdad: boolean): Promise<Resultado> {
  if (!ID_MEDIO.test(creadoraId)) return { ok: false, error: "No encontramos esta página." };
  const fan = await fanActual();
  if (!fan) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo; no se descontó nada." };
  if (await bloqueadoPorPais(creadoraId)) return { ok: false, error: ERRORES.suscripcion_no_disponible };

  await asegurarFan(fan.id);
  const supabase = await supabaseServidor();
  if (confirmaEdad) {
    const { error } = await supabase.rpc("confirmar_mayoria_edad");
    if (error) throw error;
  }
  const { data, error } = await supabase.rpc("suscribirse", { p_creadora: creadoraId });
  if (error) {
    const r = traducir(error.message, { faltan: error.message === "saldo_insuficiente" });
    if (r) return r;
    throw error;
  }
  revalidatePath("/mis-compras");
  return { ok: true, hasta: data };
}

/** F9: deja de renovarse. Sigue viendo todo hasta el fin del mes pagado. */
export async function cancelar(creadoraId: string): Promise<Resultado> {
  if (!ID_MEDIO.test(creadoraId)) return { ok: false, error: "No encontramos esta página." };
  const fan = await fanActual();
  if (!fan) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo." };
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("cancelar_suscripcion", { p_creadora: creadoraId });
  if (error) {
    const r = traducir(error.message);
    if (r) return r;
    throw error;
  }
  revalidatePath("/mis-compras");
  return { ok: true, hasta: data };
}

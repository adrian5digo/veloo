"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { ID_MEDIO } from "@/lib/medios";
import { avisarDesbloqueo } from "@/server/correo";
import { asegurarFan, fanActual } from "@/server/fan";
import { hashToken } from "@/server/pagos";
import { bloqueadoPorPais } from "@/server/publico";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true; ir: string } | { ok: false; error: string; faltan?: boolean };

const ERRORES: Record<string, string> = {
  saldo_insuficiente: "No te alcanzan los tokens. No se descontó nada.",
  fan_bloqueado: "No es posible desbloquear este set con esta cuenta.",
  set_no_disponible: "Este set ya no está disponible. No se descontó nada.",
  set_gratis: "Este set es gratis: no necesitas tokens.",
};

/** F4 con tokens: descuenta el saldo, crea la compra y lleva al set desbloqueado (F7). */
export async function desbloquear(setId: string): Promise<Resultado> {
  if (!ID_MEDIO.test(setId)) return { ok: false, error: "No encontramos ese set." };
  const fan = await fanActual();
  if (!fan) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo; no se descontó nada." };

  const supabase = await supabaseServidor();
  const { data: set } = await supabase.from("sets").select("creadora_id, titulo").eq("id", setId).eq("estado", "publicado").maybeSingle();
  if (!set || (await bloqueadoPorPais(set.creadora_id))) return { ok: false, error: ERRORES.set_no_disponible };

  await asegurarFan(fan.id);
  // El link permanente (/acceso/[token]) se manda por correo; aquí solo se guarda su hash.
  const token = randomBytes(32).toString("base64url");
  const hash = hashToken(token);
  const { data, error } = await supabase.rpc("desbloquear_con_tokens", { p_set: setId, p_token_hash: hash });
  if (error) {
    const texto = ERRORES[error.message];
    if (texto) return { ok: false, error: texto, faltan: error.message === "saldo_insuficiente" };
    throw error;
  }
  if (data[0].nueva) after(() => avisarDesbloqueo(fan.correo, set.titulo, token));
  return { ok: true, ir: `/mis-compras/${data[0].orden_id}` };
}

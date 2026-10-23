"use server";

import { headers } from "next/headers";
import { ID_MEDIO } from "@/lib/medios";
import { fanActual } from "@/server/fan";
import { COMISION, type Cargo, confirmarOrden, type Metodo, procesador } from "@/server/pagos";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true; ir: string } | { ok: false; error: string; rechazada?: boolean };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * F4: crea la orden y el cargo. Tarjeta aprobada → acceso (F7); OXXO / SPEI → ficha (F5 / F6);
 * tarjeta rechazada → E2. Comprar no pide cuenta: la orden se liga al correo.
 */
export async function pagar(datos: { setId: string; correo: string; metodo: Metodo; tokenTarjeta?: string }): Promise<Resultado> {
  const correo = datos.correo.trim().toLowerCase();
  if (!CORREO.test(correo)) return { ok: false, error: "Revisa tu correo: ahí te llega el acceso." };
  if (!ID_MEDIO.test(datos.setId)) return { ok: false, error: "No encontramos ese set." };
  const pagos = procesador();
  if (!pagos) return { ok: false, error: "Todavía no podemos cobrar. No se te cobró nada; vuelve pronto." };
  if (!pagos.metodos.includes(datos.metodo)) return { ok: false, error: "Ese método de pago no está disponible. No se te cobró nada." };

  // RLS: solo sets publicados de creadoras verificadas.
  const supabase = await supabaseServidor();
  const { data: set } = await supabase.from("sets").select("id, creadora_id, precio_centavos").eq("id", datos.setId).eq("estado", "publicado").maybeSingle();
  if (!set || set.precio_centavos <= 0) return { ok: false, error: "Este set ya no está disponible. No se te cobró nada." };

  const db = supabaseAdmin();
  const { data: bloqueado } = await db.rpc("esta_bloqueado", { p_creadora: set.creadora_id, p_correo: correo });
  if (bloqueado) return { ok: false, error: "No es posible comprar este set con este correo." };

  const fan = await fanActual();
  const pais = (await headers()).get("x-vercel-ip-country");
  const { data: orden, error } = await db
    .from("ordenes")
    .insert({
      set_id: set.id,
      creadora_id: set.creadora_id,
      correo,
      fan_id: fan && fan.correo === correo ? await fanExistente(fan.id) : null,
      metodo: datos.metodo,
      precio_centavos: set.precio_centavos,
      comision_centavos: Math.round(set.precio_centavos * COMISION),
      procesador: pagos.nombre,
      pais: pais && /^[A-Z]{2}$/.test(pais) ? pais : null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const cargo = await pagos.crearCargo({ id: orden.id, centavos: set.precio_centavos, correo, metodo: datos.metodo, tokenTarjeta: datos.tokenTarjeta });

  if (cargo.metodo === "tarjeta") {
    if (!cargo.aprobado) {
      await db.from("ordenes").update({ estado: "rechazada", procesador_ref: cargo.ref }).eq("id", orden.id);
      return { ok: false, rechazada: true, error: "Tu banco no aprobó el cargo. No se cobró nada." };
    }
    await db.from("ordenes").update({ procesador_ref: cargo.ref }).eq("id", orden.id);
    const token = await confirmarOrden(orden.id);
    return { ok: true, ir: token ? `/acceso/${token}?nuevo=1` : "/mis-compras" };
  }

  // SPEI manual: el concepto es único. Si sale uno repetido (muy raro), se pide otro.
  let ficha: Exclude<Cargo, { metodo: "tarjeta" }> = cargo;
  for (let intento = 0; ; intento++) {
    const { error: e2 } = await db
      .from("ordenes")
      .update(
        ficha.metodo === "oxxo"
          ? { procesador_ref: ficha.ref, oxxo_referencia: ficha.referencia, vence_en: ficha.venceEn }
          : { procesador_ref: ficha.ref, spei_clabe: ficha.clabe, spei_referencia: ficha.referencia, vence_en: ficha.venceEn },
      )
      .eq("id", orden.id);
    if (!e2) break;
    if (e2.code !== "23505" || intento >= 4) throw e2;
    const otro = await pagos.crearCargo({ id: orden.id, centavos: set.precio_centavos, correo, metodo: datos.metodo });
    if (otro.metodo === "tarjeta") throw e2;
    ficha = otro;
  }
  return { ok: true, ir: `/orden/${orden.id}` };
}

/** fan_id solo si ya creó su cuenta de fan (L3). */
async function fanExistente(id: string) {
  const { data } = await supabaseAdmin().from("fans").select("id").eq("id", id).maybeSingle();
  return data?.id ?? null;
}

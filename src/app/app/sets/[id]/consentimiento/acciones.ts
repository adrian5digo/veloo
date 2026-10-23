"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ID_MEDIO } from "@/lib/medios";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SESION_CERRADA = "Tu sesión se cerró. Entra de nuevo; tu set sigue guardado como borrador.";

/** El set es de la creadora y todavía se puede editar (borrador o rechazado). */
async function setEditable(setId: string) {
  const creadora = await creadoraActual();
  if (!creadora) return { error: SESION_CERRADA } as const;
  if (!ID_MEDIO.test(setId)) return { error: "No encontramos ese set." } as const;
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("sets")
    .select("id, estado")
    .eq("id", setId)
    .eq("creadora_id", creadora.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { error: "No encontramos ese set." } as const;
  if (data.estado !== "borrador" && data.estado !== "rechazado") {
    return { error: "Este set ya se envió a revisión; ya no se puede cambiar." } as const;
  }
  return { creadora, supabase } as const;
}

/** "+52 55 1234 5678" → "+525512345678". Diez dígitos sin lada se toman como México. */
function normalizarTelefono(texto: string) {
  const digitos = texto.replace(/\D/g, "");
  if (digitos.length === 10) return `+52${digitos}`;
  if (digitos.length >= 11 && digitos.length <= 15) return `+${digitos}`;
  return null;
}

/** Token del link de firma: solo se guarda el hash; el link se muestra una vez. */
async function nuevoLink() {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "";
  return { hash, link: `${origen}/firmar/${token}` };
}

export async function marcarOtrasPersonas(setId: string, conOtras: boolean): Promise<Resultado> {
  const r = await setEditable(setId);
  if ("error" in r) return { ok: false, error: r.error! };
  const { error } = await r.supabase.from("sets").update({ con_otras_personas: conOtras }).eq("id", setId);
  if (error) throw error;
  revalidatePath(`/app/sets/${setId}/consentimiento`);
  return { ok: true };
}

/**
 * Agrega a una persona y genera su link de firma (INE + selfie + firma).
 * Mientras no haya proveedor de SMS/WhatsApp, la creadora copia el link y se lo manda.
 */
export async function agregarPersona(setId: string, telefono: string): Promise<Resultado<{ link: string }>> {
  const r = await setEditable(setId);
  if ("error" in r) return { ok: false, error: r.error! };
  const tel = normalizarTelefono(telefono);
  if (!tel) return { ok: false, error: "Revisa el teléfono: son 10 dígitos, con lada si no es de México." };

  // personas_set no se escribe desde el navegador: guarda datos de identidad.
  const { hash, link } = await nuevoLink();
  const { error } = await supabaseAdmin()
    .from("personas_set")
    .insert({
      set_id: setId,
      telefono: tel,
      token_hash: hash,
      estado_firma: "enviada",
      enviado_en: new Date().toISOString(),
    });
  if (error) throw error;
  revalidatePath(`/app/sets/${setId}/consentimiento`);
  return { ok: true, link };
}

/** Genera un link nuevo para la misma persona. El anterior deja de servir. */
export async function nuevoLinkFirma(setId: string, personaId: string): Promise<Resultado<{ link: string }>> {
  const r = await setEditable(setId);
  if ("error" in r) return { ok: false, error: r.error! };
  if (!ID_MEDIO.test(personaId)) return { ok: false, error: "No encontramos a esa persona." };
  const { hash, link } = await nuevoLink();
  const { data, error } = await supabaseAdmin()
    .from("personas_set")
    .update({ token_hash: hash, estado_firma: "enviada", enviado_en: new Date().toISOString() })
    .eq("id", personaId)
    .eq("set_id", setId)
    .in("estado_firma", ["pendiente", "enviada"])
    .select("id");
  if (error) throw error;
  if (!data.length) return { ok: false, error: "Esa persona ya respondió; no hace falta otro link." };
  revalidatePath(`/app/sets/${setId}/consentimiento`);
  return { ok: true, link };
}

export async function quitarPersona(setId: string, personaId: string): Promise<Resultado> {
  const r = await setEditable(setId);
  if ("error" in r) return { ok: false, error: r.error! };
  if (!ID_MEDIO.test(personaId)) return { ok: false, error: "No encontramos a esa persona." };
  const { error } = await supabaseAdmin().from("personas_set").delete().eq("id", personaId).eq("set_id", setId);
  if (error) throw error;
  revalidatePath(`/app/sets/${setId}/consentimiento`);
  return { ok: true };
}

/** Lo que dice cada error de enviar_a_moderacion(), en palabras de la creadora. */
const ERRORES_ENVIO: Record<string, string> = {
  set_no_encontrado: "No encontramos ese set.",
  set_no_editable: "Este set ya se envió a revisión.",
  falta_declaracion: "Marca la casilla de confirmación para enviarlo.",
  set_sin_medios: "El set no tiene fotos. Vuelve al paso 1 y sube al menos una.",
  medios_pendientes: "Alguna foto sigue procesándose. Espera unos segundos y vuelve a intentar.",
  faltan_firmas: "Falta que firmen todas las personas que aparecen.",
};

export async function enviarARevision(setId: string, declaro: boolean): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION_CERRADA };
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("enviar_a_moderacion", { p_set: setId, p_declaro: declaro });
  if (error) {
    const conocido = ERRORES_ENVIO[error.message];
    if (conocido) return { ok: false, error: conocido };
    throw error;
  }
  revalidatePath("/app/boveda");
  return { ok: true };
}

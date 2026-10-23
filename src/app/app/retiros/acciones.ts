"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { clabeValida } from "@/lib/clabe";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

const SESION = "Tu sesión se cerró. Entra de nuevo; tu saldo no se movió.";

const ERRORES_RETIRO: Record<string, string> = {
  creadora_no_verificada: "Para retirar, primero verificamos tu identidad.",
  retiro_minimo: "El retiro mínimo es de $200.",
  sin_cuenta_bancaria: "Agrega tu CLABE para poder retirar.",
  retiros_pausados: "Cambiaste tu CLABE hace menos de 24 h. Por seguridad, los retiros siguen en pausa; tu saldo no se movió.",
  saldo_insuficiente: "Tu saldo disponible cambió. Recarga la pantalla y vuelve a intentar.",
};

/** C7: retira todo el saldo disponible (lo bloquea y valida solicitar_retiro()). */
export async function retirar(montoCentavos: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("solicitar_retiro", { p_monto_centavos: montoCentavos });
  if (error) {
    const conocido = ERRORES_RETIRO[error.message];
    if (conocido) return { ok: false, error: conocido };
    throw error;
  }
  revalidatePath("/app/retiros");
  return { ok: true };
}

/**
 * C10: guarda la CLABE nueva "por confirmar" y manda un link al correo de la creadora.
 * Al confirmarla se activa y los retiros se pausan 24 h (activar_cuenta_bancaria()).
 * Mientras no haya correo transaccional, el link va en el correo de acceso de Supabase.
 */
export async function guardarClabe(clabe: string): Promise<{ ok: true; correo: string } | { ok: false; error: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  if (!clabeValida(clabe)) return { ok: false, error: "Esa CLABE no es válida. Revisa los 18 dígitos." };

  const db = supabaseAdmin();
  const [{ data: banco }, { data: privado }, { data: perfil }] = await Promise.all([
    db.from("bancos").select("nombre").eq("codigo", clabe.slice(0, 3)).maybeSingle(),
    db.from("creadoras_privado").select("nombre_legal").eq("id", creadora.id).maybeSingle(),
    db.from("creadoras").select("verificacion").eq("id", creadora.id).single(),
  ]);
  if (!banco) return { ok: false, error: "No reconocemos este banco. Revisa los primeros 3 dígitos." };
  if (perfil?.verificacion !== "aprobada" || !privado?.nombre_legal) {
    return { ok: false, error: "Primero verificamos tu identidad: la CLABE tiene que estar a tu nombre como en tu INE." };
  }

  const token = randomBytes(32).toString("base64url");
  // Una sola CLABE por confirmar a la vez.
  await db.from("cuentas_bancarias").delete().eq("creadora_id", creadora.id).eq("estado", "por_confirmar");
  const { data: cuenta, error } = await db
    .from("cuentas_bancarias")
    .insert({
      creadora_id: creadora.id,
      clabe,
      titular: privado.nombre_legal,
      token_confirmacion_hash: createHash("sha256").update(token).digest("hex"),
    })
    .select("id")
    .single();
  if (error) throw error;

  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "";
  const siguiente = `/app/retiros/clabe/confirmar?c=${cuenta.id}&t=${token}`;
  const supabase = await supabaseServidor();
  const { error: e2 } = await supabase.auth.signInWithOtp({
    email: creadora.correo,
    options: { shouldCreateUser: false, emailRedirectTo: `${origen}/auth/confirmar?siguiente=${encodeURIComponent(siguiente)}` },
  });
  if (e2) {
    return {
      ok: false,
      error: e2.status === 429 ? "Pediste varios correos seguidos. Espera un minuto y vuelve a intentar." : "No pudimos mandar el correo. Vuelve a intentar.",
    };
  }
  revalidatePath("/app/retiros");
  return { ok: true, correo: creadora.correo };
}

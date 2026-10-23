import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ID_MEDIO } from "@/lib/medios";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin } from "@/server/supabase";

/** C10: link del correo. Activa la CLABE nueva (y pausa retiros 24 h). */
export async function GET(request: NextRequest) {
  const cuentaId = request.nextUrl.searchParams.get("c") ?? "";
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const volver = (estado: string) => NextResponse.redirect(new URL(`/app/retiros?clabe=${estado}`, request.url));

  const creadora = await creadoraActual();
  if (!creadora) return NextResponse.redirect(new URL("/entrar", request.url));
  if (!ID_MEDIO.test(cuentaId) || !token) return volver("invalida");

  const db = supabaseAdmin();
  const { data: cuenta } = await db
    .from("cuentas_bancarias")
    .select("id, token_confirmacion_hash")
    .eq("id", cuentaId)
    .eq("creadora_id", creadora.id)
    .eq("estado", "por_confirmar")
    .maybeSingle();
  const hash = createHash("sha256").update(token).digest("hex");
  if (!cuenta || cuenta.token_confirmacion_hash !== hash) return volver("invalida");

  const { error } = await db.rpc("activar_cuenta_bancaria", { p_cuenta: cuenta.id });
  if (error) throw error;
  return volver("ok");
}

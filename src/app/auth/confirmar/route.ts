import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinoSeguro } from "@/lib/destino";
import { supabaseServidor } from "@/server/supabase";

/** Destino del link mágico. Acepta token_hash (plantilla recomendada) o code (PKCE). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const siguiente = destinoSeguro(searchParams.get("siguiente"));
  const supabase = await supabaseServidor();

  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const { error } = tokenHash && tipo
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Link incompleto") };

  if (error) {
    const entrar = new URL("/entrar", request.url);
    entrar.searchParams.set("vencido", "1");
    entrar.searchParams.set("siguiente", siguiente);
    return NextResponse.redirect(entrar);
  }
  // `siguiente` puede traer su propia query (ej. confirmar CLABE): se resuelve como URL, no como pathname.
  return NextResponse.redirect(new URL(siguiente, request.url));
}

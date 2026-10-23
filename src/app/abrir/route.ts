import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/server/supabase";

/** Arranque de la app instalada (P4): la creadora va a su bóveda; el fan, a su inicio. */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/entrar", request.url));
  const { data } = await supabase.from("creadoras").select("usuario").eq("id", user.id).maybeSingle();
  return NextResponse.redirect(new URL(data?.usuario ? "/app/boveda" : "/inicio", request.url));
}

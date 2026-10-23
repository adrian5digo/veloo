import { NextResponse, type NextRequest } from "next/server";
import { ID_MEDIO } from "@/lib/medios";
import { supabaseServidor } from "@/server/supabase";

/** L3, paso final: ya entró con el link. Guarda nombre visible y "seguir", y ofrece guardar la app (P1/P2). */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/entrar?siguiente=/mis-compras", request.url));

  const nombre = request.nextUrl.searchParams.get("nombre")?.trim().slice(0, 40) || null;
  const seguir = request.nextUrl.searchParams.get("seguir");
  const { error } = await supabase.from("fans").upsert({ id: user.id, nombre_visible: nombre }, { onConflict: "id" });
  if (error) throw error;
  if (seguir && ID_MEDIO.test(seguir)) {
    await supabase.from("seguimientos").upsert({ fan_id: user.id, creadora_id: seguir }, { onConflict: "fan_id,creadora_id", ignoreDuplicates: true });
  }
  return NextResponse.redirect(new URL("/guardar?siguiente=/mis-compras", request.url));
}

import { supabaseServidor } from "@/server/supabase";

/** R3 · "Descargar mis datos": todo lo que la persona puede ver de sí misma, en JSON. */
export async function GET() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  // RLS limita cada consulta a lo propio; las vistas ya enmascaran lo de terceros.
  const [creadora, privado, ajustes, sets, retiros, ventas, cuenta, fan, compras, seguimientos] = await Promise.all([
    supabase.from("creadoras").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("creadoras_privado").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("ajustes_creadora").select("*").eq("creadora_id", user.id).maybeSingle(),
    supabase.from("sets").select("id, titulo, slug, precio_centavos, estado, creado_en, publicado_en").eq("creadora_id", user.id),
    supabase.from("retiros").select("monto_centavos, estado, solicitado_en, pagado_en"),
    supabase.from("mis_ventas").select("*"),
    supabase.from("mi_cuenta_bancaria").select("*"),
    supabase.from("fans").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("mis_compras").select("*"),
    supabase.from("seguimientos").select("creadora_id, creado_en"),
  ]);

  const datos = {
    generado_en: new Date().toISOString(),
    correo: user.email,
    cuenta_creada_en: user.created_at,
    creadora: creadora.data ? { perfil: creadora.data, datos_privados: privado.data, ajustes: ajustes.data, sets: sets.data, ventas: ventas.data, retiros: retiros.data, cuenta_bancaria: cuenta.data } : null,
    fan: { cuenta: fan.data, compras: compras.data, siguiendo: seguimientos.data },
  };

  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="veloo-mis-datos.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Suscripcion } from "./suscripcion";

export const metadata: Metadata = { title: "Suscripción · Veloo" };

/** C16 · Suscripción mensual: prenderla, ponerle precio en tokens y ver cuántos la tienen. */
export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/perfil/suscripcion");
  const supabase = await supabaseServidor();
  const [{ data: c }, { data: resumen }] = await Promise.all([
    supabase.from("creadoras").select("usuario, suscripcion_tokens").eq("id", creadora.id).single(),
    supabase.from("mis_suscriptores").select("*").maybeSingle(),
  ]);
  if (!c?.usuario) redirect("/app/registro");

  return (
    <Suscripcion
      tokens={c.suscripcion_tokens}
      activas={resumen?.activas ?? 0}
      seRenuevan={resumen?.se_renuevan ?? 0}
      neto30={(resumen?.neto_30_dias_centavos ?? 0) / 100}
    />
  );
}

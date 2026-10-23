import { isoHaceDias } from "@/lib/tiempo";
import { supabaseAdmin } from "@/server/supabase";
import { Metricas, type OrdenMetrica } from "./metricas";

/** A3 · Métricas: GMV, ingreso de Veloo, creadoras activas y contracargos (últimos 60 días). */
export default async function Page() {
  const desde = isoHaceDias(60);
  const { data, error } = await supabaseAdmin()
    .from("ordenes")
    .select("creadora_id, metodo, estado, precio_centavos, comision_centavos, pagada_en")
    .not("pagada_en", "is", null)
    .gte("pagada_en", desde);
  if (error) throw error;
  const ordenes: OrdenMetrica[] = data.map((o) => ({
    creadora: o.creadora_id,
    metodo: o.metodo,
    contracargo: o.estado === "contracargo",
    precio: o.precio_centavos / 100,
    comision: o.comision_centavos / 100,
    pagadaEn: o.pagada_en!,
  }));
  return <Metricas ordenes={ordenes} />;
}

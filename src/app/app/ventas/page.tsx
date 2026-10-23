import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isoHaceDias } from "@/lib/tiempo";
import { creadoraActual } from "@/server/sesion";
import { haySinLeer } from "@/server/mensajes";
import { supabaseServidor } from "@/server/supabase";
import { Ventas, type Venta } from "./ventas";

export const metadata: Metadata = { title: "Ventas · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/ventas");
  const supabase = await supabaseServidor();
  const desde = isoHaceDias(31);
  // mis_ventas ya filtra por la creadora y enmascara el correo.
  const [{ data, error }, { data: subs }] = await Promise.all([
    supabase
      .from("mis_ventas")
      .select("id, folio, set_id, titulo, metodo, estado, precio_centavos, comision_centavos, neto_centavos, pagada_en")
      .gte("pagada_en", desde)
      .order("pagada_en", { ascending: false }),
    supabase.from("mis_suscriptores").select("*").maybeSingle(),
  ]);
  if (error) throw error;

  const ventas: Venta[] = data.map((v) => ({
    id: v.id!,
    folio: v.folio!,
    setId: v.set_id!,
    titulo: v.titulo!,
    metodo: v.metodo!,
    estado: v.estado!,
    precio: v.precio_centavos! / 100,
    comision: v.comision_centavos! / 100,
    neto: v.neto_centavos! / 100,
    pagadaEn: v.pagada_en!,
  }));
  const suscripciones = subs && {
    activas: subs.activas ?? 0,
    seRenuevan: subs.se_renuevan ?? 0,
    neto30: (subs.neto_30_dias_centavos ?? 0) / 100,
  };
  return <Ventas ventas={ventas} suscripciones={suscripciones} sinLeer={await haySinLeer("creadora")} />;
}

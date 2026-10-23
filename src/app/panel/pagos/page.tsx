import { isoHaceDias } from "@/lib/tiempo";
import { cuentaSpeiManual } from "@/server/pagos";
import { supabaseAdmin } from "@/server/supabase";
import { Pagos, type FilaPago } from "./pagos";

/** Pagos por SPEI manual: por confirmar (también vencidas, por si transfirieron tarde) y confirmados de la semana. */
export default async function Page() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("ordenes")
    .select("id, folio, spei_referencia, precio_centavos, correo, estado, creada_en, vence_en, pagada_en, sets(titulo), creadoras(nombre, usuario)")
    .eq("procesador", "spei_manual")
    .or(`and(estado.in.(pendiente,vencida),creada_en.gt.${isoHaceDias(30)}),and(estado.eq.pagada,pagada_en.gt.${isoHaceDias(7)})`)
    .order("creada_en", { ascending: true })
    .limit(300);
  if (error) throw error;

  const filas: FilaPago[] = data.map((o) => ({
    id: o.id,
    folio: o.folio,
    concepto: o.spei_referencia ?? "",
    centavos: o.precio_centavos,
    correo: o.correo,
    estado: o.estado,
    creadaEn: o.creada_en,
    venceEn: o.vence_en,
    set: [o.sets?.titulo, o.creadoras?.nombre || o.creadoras?.usuario].filter(Boolean).join(" · "),
  }));
  const cuenta = cuentaSpeiManual();
  return <Pagos filas={filas} clabe={cuenta?.clabe ?? null} />;
}

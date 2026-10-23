import { isoHaceDias } from "@/lib/tiempo";
import { supabaseAdmin } from "@/server/supabase";
import { Reportes, type FilaReporte } from "./reportes";

/** A4 · Reportes: abiertos primero (urgentes arriba) y los resueltos de la última semana. */
export default async function Page() {
  const db = supabaseAdmin();
  const semana = isoHaceDias(7);
  const { data, error } = await db
    .from("reportes")
    .select("id, folio, motivo, urgente, estado, creado_en, conversacion_id, sets(titulo), creadoras(nombre, usuario)")
    .or(`estado.eq.abierto,resuelto_en.gt.${semana}`)
    .order("estado", { ascending: true })
    .order("urgente", { ascending: false })
    .order("creado_en", { ascending: true })
    .limit(200);
  if (error) throw error;

  const filas: FilaReporte[] = data.map((r) => ({
    id: r.id,
    folio: r.folio,
    motivo: r.motivo,
    urgente: r.urgente,
    estado: r.estado,
    creadoEn: r.creado_en,
    set:
      [r.conversacion_id ? "Conversación" : r.sets?.titulo, r.creadoras?.nombre || r.creadoras?.usuario].filter(Boolean).join(" · ") || "Sin set",
    conSet: !!r.sets,
    conversacion: r.conversacion_id ? r.id : null,
  }));
  return <Reportes filas={filas} />;
}

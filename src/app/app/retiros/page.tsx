import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Retiros } from "./retiros";

export const metadata: Metadata = { title: "Retiros · Veloo" };

/** C7 · Retiros. */
export default async function Page({ searchParams }: PageProps<"/app/retiros">) {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/retiros");
  const { clabe } = await searchParams;
  const supabase = await supabaseServidor();
  const [{ data: saldo }, { data: cuentas }, { data: retiros }, { data: perfil }] = await Promise.all([
    supabase.from("mi_saldo").select("*").maybeSingle(),
    supabase.from("mi_cuenta_bancaria").select("*"),
    supabase.from("retiros").select("id, monto_centavos, estado, solicitado_en, pagado_en").order("solicitado_en", { ascending: false }).limit(20),
    supabase.from("creadoras").select("verificacion").eq("id", creadora.id).single(),
  ]);

  const activa = cuentas?.find((c) => c.estado === "activa") ?? null;
  const porConfirmar = cuentas?.find((c) => c.estado === "por_confirmar") ?? null;

  return (
    <Retiros
      disponible={Number(saldo?.disponible_centavos ?? 0) / 100}
      retenido={Number(saldo?.retenido_centavos ?? 0) / 100}
      verificada={perfil?.verificacion === "aprobada"}
      cuenta={activa && { banco: activa.banco!, clabe: activa.clabe!, pausaHasta: activa.retiros_pausados_hasta }}
      porConfirmar={!!porConfirmar}
      aviso={clabe === "ok" ? "ok" : clabe === "invalida" ? "invalida" : null}
      historial={(retiros ?? []).map((r) => ({
        id: r.id,
        monto: r.monto_centavos / 100,
        estado: r.estado,
        fecha: r.pagado_en ?? r.solicitado_en,
      }))}
    />
  );
}

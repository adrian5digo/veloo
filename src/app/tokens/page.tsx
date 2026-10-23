import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { destinoSeguro } from "@/lib/destino";
import { ID_MEDIO } from "@/lib/medios";
import { fanActual, mayorDeEdad } from "@/server/fan";
import { PAQUETES, stripeListo } from "@/server/stripe";
import { supabaseServidor } from "@/server/supabase";
import { Tokens, type Movimiento } from "./tokens";

export const metadata: Metadata = { title: "Tus tokens · Veloo", robots: { index: false } };

/** Saldo, paquetes y movimientos del fan. Al volver de Stripe muestra cómo va esa compra. */
export default async function Page({ searchParams }: PageProps<"/tokens">) {
  const { compra: compraId, para: paraCrudo } = await searchParams;
  const para = typeof paraCrudo === "string" ? destinoSeguro(paraCrudo, "") : "";
  const fan = await fanActual();
  if (!fan) {
    const aqui = `/tokens${para ? `?para=${encodeURIComponent(para)}` : ""}`;
    redirect(`/entrar?siguiente=${encodeURIComponent(aqui)}`);
  }

  const supabase = await supabaseServidor();
  const [{ data: saldo }, { data: movs }, compra, edad] = await Promise.all([
    supabase.from("mi_saldo_tokens").select("tokens").maybeSingle(),
    supabase
      .from("movimientos_tokens")
      .select("id, tipo, tokens, orden_id, cobro_suscripcion_id, creado_en")
      .order("creado_en", { ascending: false })
      .limit(20),
    typeof compraId === "string" && ID_MEDIO.test(compraId)
      ? supabase.from("compras_tokens").select("tokens, estado").eq("id", compraId).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
    mayorDeEdad(fan.id),
  ]);

  // Los títulos de los sets desbloqueados salen de mis_compras (el fan no lee órdenes directo).
  const ordenes = (movs ?? []).map((m) => m.orden_id).filter((x): x is string => !!x);
  const { data: compras } = ordenes.length ? await supabase.from("mis_compras").select("id, titulo").in("id", ordenes) : { data: [] };
  const titulos = new Map((compras ?? []).map((c) => [c.id, c.titulo]));
  // Cobros de suscripción: a quién.
  const cobros = (movs ?? []).map((m) => m.cobro_suscripcion_id).filter((x): x is string => !!x);
  const { data: subs } = cobros.length
    ? await supabase.from("cobros_suscripcion").select("id, creadora_id").in("id", cobros)
    : { data: [] };
  const { data: nombres } = subs?.length
    ? await supabase.from("creadoras").select("id, nombre, usuario").in("id", [...new Set(subs.map((x) => x.creadora_id))])
    : { data: [] };
  const nombreDe = new Map((nombres ?? []).map((c) => [c.id, c.nombre || c.usuario]));
  const suscripcionDe = new Map((subs ?? []).map((x) => [x.id, nombreDe.get(x.creadora_id)]));

  const movimientos: Movimiento[] = (movs ?? []).map((m) => ({
    id: m.id,
    tokens: m.tokens,
    creadoEn: m.creado_en,
    concepto:
      m.tipo === "compra"
        ? "Compra de tokens"
        : m.tipo === "desbloqueo"
          ? (titulos.get(m.orden_id ?? "") ?? "Set desbloqueado")
          : m.tipo === "suscripcion"
            ? `Suscripción${suscripcionDe.get(m.cobro_suscripcion_id ?? "") ? ` a ${suscripcionDe.get(m.cobro_suscripcion_id ?? "")}` : ""}`
            : m.tipo === "reembolso"
              ? "Reembolso"
              : "Ajuste",
  }));

  return <Tokens saldo={saldo?.tokens ?? 0} paquetes={[...PAQUETES]} compra={compra} para={para} movimientos={movimientos} disponible={stripeListo()} mayorDeEdad={edad} />;
}

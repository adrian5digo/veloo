import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ID_MEDIO } from "@/lib/medios";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Consentimiento } from "./consentimiento";

export const metadata: Metadata = { title: "Consentimiento · Veloo" };

export default async function Page({ params }: PageProps<"/app/sets/[id]/consentimiento">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const creadora = await creadoraActual();
  if (!creadora) redirect(`/entrar?siguiente=/app/sets/${id}/consentimiento`);

  const supabase = await supabaseServidor();
  const [{ data: set, error: e1 }, { data: personas, error: e2 }] = await Promise.all([
    supabase
      .from("sets")
      .select("id, titulo, estado, con_otras_personas, motivo_rechazo")
      .eq("id", id)
      .eq("creadora_id", creadora.id)
      .maybeSingle(),
    supabase
      .from("personas_de_mis_sets")
      .select("id, telefono, estado_firma, enviado_en")
      .eq("set_id", id)
      .order("enviado_en", { ascending: true }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (!set) notFound();
  // Ya enviado: aquí no hay nada que editar.
  if (set.estado !== "borrador" && set.estado !== "rechazado") redirect("/app/boveda");

  return (
    <Consentimiento
      setId={set.id}
      titulo={set.titulo}
      conOtrasInicial={set.con_otras_personas}
      motivoRechazo={set.estado === "rechazado" ? set.motivo_rechazo : null}
      personas={(personas ?? []).map((p) => ({ id: p.id!, telefono: p.telefono!, estado: p.estado_firma! }))}
    />
  );
}

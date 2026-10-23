import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Envio } from "./envio";

export const metadata: Metadata = { title: "Mandar un set · Veloo" };

/** C14 · Mandar un set a un grupo de fans: compradores, suscriptores o seguidores. */
export default async function Page({ searchParams }: PageProps<"/app/mensajes/enviar">) {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/mensajes/enviar");
  const { set } = await searchParams;
  const supabase = await supabaseServidor();
  const { data: sets, error } = await supabase
    .from("sets")
    .select("id, titulo, precio_centavos, portada_id")
    .eq("creadora_id", creadora.id)
    .eq("estado", "publicado")
    .order("publicado_en", { ascending: false });
  if (error) throw error;

  return (
    <Envio
      sets={sets.map((s) => ({ id: s.id, titulo: s.titulo, precio: s.precio_centavos / 100, portadaId: s.portada_id }))}
      inicial={typeof set === "string" && sets.some((s) => s.id === set) ? set : (sets[0]?.id ?? null)}
    />
  );
}

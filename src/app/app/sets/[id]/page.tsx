import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cuantasFotos, iniciales } from "@/lib/texto";
import { ID_MEDIO } from "@/lib/medios";
import { precioMXN } from "@/lib/dinero";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Publicado } from "./publicado";

export const metadata: Metadata = { title: "Set publicado · Veloo" };

export default async function Page({ params }: PageProps<"/app/sets/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const creadora = await creadoraActual();
  if (!creadora) redirect(`/entrar?siguiente=/app/sets/${id}`);

  const supabase = await supabaseServidor();
  const [{ data: set, error: e1 }, { data: perfil, error: e2 }, { count, error: e3 }] = await Promise.all([
    supabase
      .from("sets")
      .select("titulo, slug, estado, precio_centavos, portada_id")
      .eq("id", id)
      .eq("creadora_id", creadora.id)
      .maybeSingle(),
    supabase.from("creadoras").select("usuario, nombre").eq("id", creadora.id).single(),
    supabase.from("medios").select("id", { count: "exact", head: true }).eq("set_id", id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  if (!set) notFound();
  if (set.estado === "borrador" || set.estado === "rechazado") redirect(`/app/sets/${id}/consentimiento`);
  if (set.estado !== "publicado" || !perfil.usuario) redirect("/app/boveda");

  const fotos = cuantasFotos(count ?? 0);
  const detalle = set.precio_centavos > 0 ? `${fotos} · ${precioMXN(set.precio_centavos / 100)}` : `${fotos} · gratis`;

  return (
    <Publicado
      titulo={set.titulo}
      usuario={perfil.usuario}
      slug={set.slug}
      historia={{ iniciales: iniciales(perfil.nombre || perfil.usuario), usuario: perfil.usuario, detalle, portada: set.portada_id ? `/api/creadora/medios/${set.portada_id}/historia` : undefined }}
    />
  );
}

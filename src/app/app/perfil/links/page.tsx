import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Links } from "./links";

export const metadata: Metadata = { title: "Mis links · Veloo" };

/** Links de la creadora (tipo Linktree): aparecen arriba de sus sets en su página pública. */
export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/perfil/links");
  const supabase = await supabaseServidor();
  const [{ data: c }, { data: links, error }] = await Promise.all([
    supabase.from("creadoras").select("usuario").eq("id", creadora.id).single(),
    supabase.from("links_creadora").select("id, titulo, url, red, activo, clics").eq("creadora_id", creadora.id).order("orden"),
  ]);
  if (error) throw error;
  if (!c?.usuario) redirect("/app/registro");
  return <Links usuario={c.usuario} iniciales={links} />;
}

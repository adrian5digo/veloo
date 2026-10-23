import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ID_MEDIO } from "@/lib/medios";
import { supabaseServidor } from "@/server/supabase";

export const metadata: Metadata = { robots: { index: false } };

/** Botón de un link de la creadora: cuenta el clic y lleva a su red. Si lo borró o apagó, 404. */
export default async function Page({ params }: PageProps<"/l/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const supabase = await supabaseServidor();
  const { data: url, error } = await supabase.rpc("abrir_link", { p_link: id });
  if (error) throw error;
  if (!url) notFound();
  redirect(url);
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Paises } from "./paises";

export const metadata: Metadata = { title: "Bloquear países · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/perfil/paises");
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("ajustes_creadora").select("paises_bloqueados").eq("creadora_id", creadora.id).maybeSingle();
  return <Paises iniciales={data?.paises_bloqueados ?? []} />;
}

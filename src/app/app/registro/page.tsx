import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Registro } from "./registro";

export const metadata: Metadata = { title: "Crea tu cuenta · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/registro");
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("creadoras").select("usuario").eq("id", creadora.id).single();
  if (data?.usuario) redirect("/app/boveda");
  return <Registro correo={creadora.correo} dominio={process.env.NEXT_PUBLIC_DOMINIO || "veloo.vip"} />;
}

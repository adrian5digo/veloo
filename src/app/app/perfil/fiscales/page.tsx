import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Fiscales } from "./fiscales";

export const metadata: Metadata = { title: "Datos fiscales · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/perfil/fiscales");
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("creadoras_privado").select("rfc, regimen_fiscal, codigo_postal_fiscal").eq("id", creadora.id).maybeSingle();
  return <Fiscales rfc={data?.rfc ?? ""} regimen={data?.regimen_fiscal ?? ""} cp={data?.codigo_postal_fiscal ?? ""} />;
}

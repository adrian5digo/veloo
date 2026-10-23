import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Clabe } from "./clabe";

export const metadata: Metadata = { title: "Cuenta para retiros · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/retiros/clabe");
  const supabase = await supabaseServidor();
  const [{ data: bancos }, { data: privado }] = await Promise.all([
    supabase.from("bancos").select("codigo, nombre"),
    supabase.from("creadoras_privado").select("nombre_legal").eq("id", creadora.id).maybeSingle(),
  ]);
  return <Clabe bancos={Object.fromEntries((bancos ?? []).map((b) => [b.codigo, b.nombre]))} titular={privado?.nombre_legal ?? null} />;
}

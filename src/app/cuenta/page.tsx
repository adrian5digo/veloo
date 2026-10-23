import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { portadasNitidas } from "@/server/fan";
import { hashToken } from "@/server/pagos";
import { supabaseAdmin } from "@/server/supabase";
import { Cuenta } from "./cuenta";

export const metadata: Metadata = { title: "Crea tu cuenta · Veloo", robots: { index: false } };

/** L3 · Llega desde el acceso de una compra. */
export default async function Page({ searchParams }: PageProps<"/cuenta">) {
  const { acceso } = await searchParams;
  if (typeof acceso !== "string" || !/^[A-Za-z0-9_-]{40,60}$/.test(acceso)) notFound();
  const { data } = await supabaseAdmin()
    .from("accesos")
    .select("correo, revocado_en, sets(titulo, portada_id, creadoras(nombre, usuario))")
    .eq("token_hash", hashToken(acceso))
    .maybeSingle();
  if (!data?.sets || data.revocado_en) notFound();
  const portadas = await portadasNitidas([data.sets.portada_id]);
  const c = data.sets.creadoras;
  return (
    <Cuenta
      acceso={acceso}
      correo={data.correo}
      titulo={data.sets.titulo}
      creadora={c ? c.nombre || c.usuario : null}
      portada={data.sets.portada_id ? (portadas.get(data.sets.portada_id) ?? null) : null}
    />
  );
}

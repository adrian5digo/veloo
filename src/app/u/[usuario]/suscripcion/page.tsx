import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rutaPublica } from "@/lib/links";
import { urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fanActual, mayorDeEdad, relacionCon } from "@/server/fan";
import { bloqueadoPorPais, perfilPublico } from "@/server/publico";
import { supabaseServidor } from "@/server/supabase";
import { Suscripcion } from "./suscripcion";

export const metadata: Metadata = { title: "Suscripción · Veloo", robots: { index: false } };

/** F9 · Suscripción mensual con tokens: todos los sets de la creadora mientras esté activa. */
export default async function Page({ params }: PageProps<"/u/[usuario]/suscripcion">) {
  const { usuario } = await params;
  const perfil = await perfilPublico(usuario);
  if (!perfil || (await bloqueadoPorPais(perfil.id))) notFound();

  const fan = await fanActual();
  let saldo: number | null = null;
  let edad = false;
  let actual = null;
  if (fan) {
    const supabase = await supabaseServidor();
    const [{ data }, mayor, relacion] = await Promise.all([
      supabase.from("mi_saldo_tokens").select("tokens").maybeSingle(),
      mayorDeEdad(fan.id),
      relacionCon(perfil),
    ]);
    saldo = data?.tokens ?? 0;
    edad = mayor;
    actual = relacion.suscripcion;
  }
  // Sin oferta y sin suscripción propia que mostrar: no hay nada aquí.
  if (perfil.suscripcionTokens === null && !actual?.activa) notFound();

  return (
    <Suscripcion
      creadoraId={perfil.id}
      nombre={perfil.nombre}
      iniciales={iniciales(perfil.nombre)}
      avatar={urlAvatar(perfil.avatarPath)}
      sets={perfil.sets.filter((s) => s.precio > 0).length}
      costo={actual?.activa ? actual.tokens : perfil.suscripcionTokens!}
      saldo={saldo}
      mayorDeEdad={edad}
      actual={actual}
      volver={rutaPublica(usuario)}
      aqui={`${rutaPublica(usuario)}/suscripcion`}
    />
  );
}

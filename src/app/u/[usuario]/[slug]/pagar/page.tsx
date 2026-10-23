import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { rutaPublica } from "@/lib/links";
import { urlVelo } from "@/lib/medios";
import { cuantasFotos } from "@/lib/texto";
import { fanActual, relacionCon } from "@/server/fan";
import { bloqueadoPorPais, perfilPublico } from "@/server/publico";
import { supabaseServidor } from "@/server/supabase";
import { Desbloquear } from "./desbloquear";
import { Gratis } from "./gratis";
import { PagoDirecto } from "./directo";
import { stripeEnVivo } from "@/server/stripe";
import { cobroDirectoPiloto } from "@/server/piloto";

export const metadata: Metadata = { title: "Desbloquear · Veloo", robots: { index: false } };

/** F4 · Desbloquear con tokens (o el set completo si es gratis). */
export default async function Page({ params, searchParams }: PageProps<"/u/[usuario]/[slug]/pagar">) {
  const { usuario, slug } = await params;
  const perfil = await perfilPublico(usuario);
  if (!perfil || (await bloqueadoPorPais(perfil.id))) notFound();
  const set = perfil.sets.find((s) => s.slug === slug);
  if (!set) redirect(rutaPublica(usuario, slug));

  if (set.precio === 0) return <Gratis setId={set.id} titulo={set.titulo} volver={rutaPublica(usuario, slug)} creadora={perfil.nombre} />;

  const fan = await fanActual();
  const directo = await cobroDirectoPiloto(perfil.id);
  let saldo: number | null = null;
  if (fan) {
    const supabase = await supabaseServidor();
    // Si ya lo tiene, directo a verlo: no se cobra dos veces.
    const { data: propia } = await supabase.from("mis_compras").select("id").eq("set_id", set.id).eq("estado", "pagada").limit(1).maybeSingle();
    if (propia) redirect(`/mis-compras/${propia.id}`);
    // Con suscripción activa ya lo puede ver: tampoco se cobra.
    if (fan.id !== perfil.id && (await relacionCon(perfil)).suscripcion?.activa) redirect(`/ver/${set.id}`);
    if (!directo) saldo = (await supabase.from("mi_saldo_tokens").select("tokens").maybeSingle()).data?.tokens ?? 0;
  }

  if (directo) return <PagoDirecto enVivo={stripeEnVivo()} setId={set.id} titulo={set.titulo} creadora={perfil.nombre} monto={set.precio} portada={set.portadaId ? urlVelo(set.portadaId, "mini") : null} volver={rutaPublica(usuario, slug)} correoInicial={fan?.correo ?? ""} cancelado={(await searchParams).cancelado === "1"} />;

  return (
    <Desbloquear
      setId={set.id}
      titulo={set.titulo}
      detalle={cuantasFotos(set.fotos)}
      creadora={perfil.nombre}
      costo={Math.ceil(set.precio)}
      saldo={saldo}
      portada={set.portadaId ? urlVelo(set.portadaId, "mini") : null}
      volver={rutaPublica(usuario, slug)}
      aqui={`${rutaPublica(usuario, slug)}/pagar`}
    />
  );
}

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/ui";
import { rutaPublica } from "@/lib/links";
import { urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fanActual, mayorDeEdad, relacionCon } from "@/server/fan";
import { perfilPublico } from "@/server/publico";
import { supabaseServidor } from "@/server/supabase";
import { HiloFan } from "../../[id]/hilo-fan";

export const metadata: Metadata = { title: "Mensaje nuevo · Veloo", robots: { index: false } };

/** F8 · Escribirle a una creadora por primera vez. Si ya hay conversación, lleva a ella. */
export default async function Page({ params }: PageProps<"/mensajes/nueva/[usuario]">) {
  const { usuario } = await params;
  const fan = await fanActual();
  if (!fan) redirect(`/entrar?siguiente=/mensajes/nueva/${usuario}`);
  const perfil = await perfilPublico(usuario);
  if (!perfil || perfil.id === fan.id) notFound();

  const supabase = await supabaseServidor();
  const { data: existente } = await supabase.from("conversaciones").select("id").eq("creadora_id", perfil.id).eq("fan_id", fan.id).maybeSingle();
  if (existente) redirect(`/mensajes/${existente.id}`);

  const [relacion, edad] = await Promise.all([relacionCon(perfil), mayorDeEdad(fan.id)]);
  const bloqueo = !perfil.mensajesAbiertos
    ? `${perfil.nombre} no recibe mensajes por ahora.`
    : !relacion.compro && !relacion.suscripcion?.activa
      ? "Puedes escribirle cuando le compres un set o te suscribas."
      : !edad
        ? "Para escribir, confirma que tienes 18 años o más al comprar tokens."
        : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-bg px-4 py-2">
        <Link href={rutaPublica(usuario)} aria-label="Regresar" className="-ml-1.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={36} className="text-xs" />
        <span className="truncate text-base font-bold">{perfil.nombre}</span>
      </header>
      <HiloFan creadoraId={perfil.id} mensajes={[]} bloqueo={bloqueo} nueva />
    </main>
  );
}

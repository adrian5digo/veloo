import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MenuConversacion } from "@/components/mensajes/reportar";
import { Avatar } from "@/components/ui";
import { rutaPublica } from "@/lib/links";
import { ID_MEDIO, urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fanActual, mayorDeEdad, relacionCon } from "@/server/fan";
import { hilo } from "@/server/mensajes";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";
import { HiloFan } from "./hilo-fan";

export const metadata: Metadata = { title: "Mensajes · Veloo", robots: { index: false } };

/** F8 · Conversación del fan con una creadora. */
export default async function Page({ params }: PageProps<"/mensajes/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const fan = await fanActual();
  if (!fan) redirect(`/entrar?siguiente=/mensajes/${id}`);

  const datos = await hilo(id, "fan");
  if (!datos || datos.conversacion.fan_id !== fan.id) notFound();
  const supabase = await supabaseServidor();
  await supabase.rpc("marcar_leida", { p_conversacion: id });

  // Perfil público de la creadora (aunque ya no esté verificada, para nombrarla en el encabezado).
  const { data: c } = await supabaseAdmin()
    .from("creadoras")
    .select("id, usuario, nombre, avatar_path, mensajes_abiertos, verificacion")
    .eq("id", datos.conversacion.creadora_id)
    .single();
  if (!c?.usuario) notFound();
  const nombre = c.nombre || c.usuario;

  const [relacion, edad] = await Promise.all([relacionCon({ id: c.id, usuario: c.usuario }), mayorDeEdad(fan.id)]);
  const bloqueo =
    c.verificacion !== "aprobada" || !c.mensajes_abiertos
      ? `${nombre} no recibe mensajes por ahora.`
      : !relacion.compro && !relacion.suscripcion?.activa
        ? "Puedes contestar cuando le compres un set o te suscribas."
        : !edad
          ? "Para escribir, confirma que tienes 18 años o más al comprar tokens."
          : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-bg px-4 py-2">
        <Link href="/mensajes" aria-label="Mensajes" className="-ml-1.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <Link href={rutaPublica(c.usuario)} className="flex min-w-0 flex-1 items-center gap-2.5 text-text! no-underline">
          <Avatar iniciales={iniciales(nombre)} src={urlAvatar(c.avatar_path)} tamano={36} className="text-xs" />
          <span className="truncate text-base font-bold">{nombre}</span>
        </Link>
        <MenuConversacion conversacionId={id} />
      </header>
      <HiloFan creadoraId={c.id} mensajes={datos.mensajes} bloqueo={bloqueo} />
    </main>
  );
}

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MenuConversacion } from "@/components/mensajes/reportar";
import { Avatar } from "@/components/ui";
import { ID_MEDIO } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { hilo } from "@/server/mensajes";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { HiloCreadora } from "./hilo-creadora";

export const metadata: Metadata = { title: "Mensajes · Veloo" };

/** C13 · Conversación con un fan: contestar, mandarle un set, reportar o bloquear. */
export default async function Page({ params }: PageProps<"/app/mensajes/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const creadora = await creadoraActual();
  if (!creadora) redirect(`/entrar?siguiente=/app/mensajes/${id}`);

  const datos = await hilo(id, "creadora");
  if (!datos || datos.conversacion.creadora_id !== creadora.id) notFound();
  const supabase = await supabaseServidor();
  const [{ data: fila }, { data: sets }] = await Promise.all([
    supabase.from("bandeja_creadora").select("fan_nombre, compras, suscrito, bloqueado").eq("id", id).single(),
    supabase.from("sets").select("id, titulo, precio_centavos, portada_id").eq("creadora_id", creadora.id).eq("estado", "publicado").order("publicado_en", { ascending: false }),
    supabase.rpc("marcar_leida", { p_conversacion: id }),
  ]);
  const nombre = fila?.fan_nombre ?? "Fan";
  const meta = [fila?.suscrito ? "Suscripción activa" : null, fila?.compras ? (fila.compras === 1 ? "1 compra" : `${fila.compras} compras`) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-bg px-4 py-2">
        <Link href="/app/mensajes" aria-label="Mensajes" className="-ml-1.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <Avatar iniciales={iniciales(nombre)} tamano={36} className="text-xs" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold">{nombre}</div>
          {meta && <div className="truncate text-xs text-muted">{meta}</div>}
        </div>
        <MenuConversacion conversacionId={id} puedeBloquear={!fila?.bloqueado} />
      </header>
      <HiloCreadora
        conversacionId={id}
        mensajes={datos.mensajes}
        bloqueo={fila?.bloqueado ? "Bloqueaste a este fan: no te puede escribir ni comprar." : undefined}
        adjuntables={(sets ?? []).map((s) => ({ id: s.id, titulo: s.titulo, precio: s.precio_centavos / 100, portadaId: s.portada_id }))}
      />
    </main>
  );
}


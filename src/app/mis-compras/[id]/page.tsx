import { CaretLeftIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Descargas, Galeria } from "@/components/fan/galeria";
import { Avatar, Boton } from "@/components/ui";
import { rutaPublica } from "@/lib/links";
import { ID_MEDIO } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { contenidoDeCompra, fanActual } from "@/server/fan";
import { perfilPublico } from "@/server/publico";

export const metadata: Metadata = { title: "Tu compra · Veloo", robots: { index: false } };

/** F7 · Desbloqueado: fotos con marca de agua del correo del comprador. */
export default async function Page({ params }: PageProps<"/mis-compras/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const fan = await fanActual();
  if (!fan) redirect(`/entrar?siguiente=/mis-compras/${id}`);
  const contenido = await contenidoDeCompra(id);
  if (!contenido) notFound();
  const { compra, fotos } = contenido;
  const perfil = compra.creadora_usuario ? await perfilPublico(compra.creadora_usuario) : null;
  const otros = perfil?.sets.filter((s) => s.id !== compra.set_id).length ?? 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 pt-[22px]">
        <Link href="/mis-compras" aria-label="Mis compras" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <span className="grid size-7 flex-none place-items-center rounded-full bg-ok-soft text-ok">
          <CheckIcon weight="bold" size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-base font-semibold">{compra.titulo} · desbloqueado</h1>
          <p className="m-0 truncate text-xs text-muted">Ligado a {fan.correo}</p>
        </div>
      </header>

      <Galeria fotos={fotos} correo={fan.correo} />

      <div className="flex justify-between px-5 pt-2.5 text-[13px] text-muted">
        <span>
          {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
          {contenido.videos > 0 && ` · ${contenido.videos} ${contenido.videos === 1 ? "video" : "videos"} pronto`}
        </span>
      </div>

      <Descargas fotos={fotos} />

      {perfil && (
        <div className="mt-auto px-5 pt-4 pb-6">
          <div className="flex items-center gap-3 rounded-[22px] border border-line bg-surface p-3">
            <Avatar iniciales={iniciales(perfil.nombre)} tamano={40} />
            <div className="flex-1 text-sm leading-[1.35]">
              <b className="font-semibold">{perfil.nombre}</b>
              <br />
              <span className="text-muted">{otros === 0 ? "Por ahora es su único set" : otros === 1 ? "1 set más disponible" : `${otros} sets más disponibles`}</span>
            </div>
            <Boton variante="secundario" href={rutaPublica(perfil.usuario)} className="min-h-11! w-auto! bg-text! px-4! text-sm text-bg! hover:bg-text!">
              Ver más
            </Boton>
          </div>
        </div>
      )}
    </main>
  );
}

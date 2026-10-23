import { CaretLeftIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Descargas, Galeria } from "@/components/fan/galeria";
import { rutaPublica } from "@/lib/links";
import { ID_MEDIO } from "@/lib/medios";
import { contenidoPorSuscripcion, fanActual } from "@/server/fan";

export const metadata: Metadata = { title: "Con tu suscripción · Veloo", robots: { index: false } };

/** F7 por suscripción: el set completo, con marca de agua de su correo, mientras la suscripción siga. */
export default async function Page({ params }: PageProps<"/ver/[set]">) {
  const { set } = await params;
  if (!ID_MEDIO.test(set)) notFound();
  const fan = await fanActual();
  if (!fan) redirect(`/entrar?siguiente=/ver/${set}`);
  const contenido = await contenidoPorSuscripcion(set);
  if (!contenido) notFound();
  const { titulo, usuario, fotos } = contenido;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 pt-[22px]">
        <Link href={usuario ? rutaPublica(usuario) : "/mis-compras"} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <span className="grid size-7 flex-none place-items-center rounded-full bg-ok-soft text-ok">
          <CheckIcon weight="bold" size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-base font-semibold">{titulo}</h1>
          <p className="m-0 truncate text-xs text-muted">Con tu suscripción · ligado a {fan.correo}</p>
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
      <p className="m-0 mt-auto px-5 pt-6 pb-6 text-xs leading-normal text-pretty text-muted">
        Lo ves mientras tu suscripción siga. Si quieres conservarlo aunque termine, descárgalo o cómpralo aparte.
      </p>
    </main>
  );
}

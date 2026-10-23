import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Descargas, Galeria } from "@/components/fan/galeria";
import { fotosDeSet } from "@/server/fan";

/** Set gratis: se ve completo, sin pago ni correo. */
export async function Gratis({ setId, titulo, volver, creadora }: { setId: string; titulo: string; volver: string; creadora: string }) {
  const contenido = await fotosDeSet(setId, titulo);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg pb-6">
      <header className="flex items-center gap-2.5 px-5 pt-[22px]">
        <Link href={volver} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-base font-semibold">{titulo}</h1>
          <p className="m-0 text-xs text-muted">Gratis · de {creadora}</p>
        </div>
      </header>
      <Galeria fotos={contenido?.fotos ?? []} />
      <Descargas fotos={contenido?.fotos ?? []} />
    </main>
  );
}

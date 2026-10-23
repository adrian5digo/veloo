"use client";

import { CheckIcon, InstagramLogoIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Boton, DatoCopiable, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dibujarHistoria, ESTILOS, pngDe, type DatosHistoria } from "@/lib/historia";
import { linkPublico, linkVisible } from "@/lib/links";
import { useOrigen } from "@/lib/use-origen";

/** C5 · Publicado: link copiable y plantilla de historia en 4 estilos. */
export function Publicado({
  titulo,
  usuario,
  slug,
  historia,
}: {
  titulo: string;
  usuario: string;
  slug: string;
  historia: DatosHistoria;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [estilo, setEstilo] = useState(0);
  const [aviso, setAviso] = useState<string>();
  const origen = useOrigen();
  const link = linkPublico(usuario, slug, origen);

  useEffect(() => {
    if (canvas.current) dibujarHistoria(canvas.current, ESTILOS[estilo], historia);
  }, [estilo, historia]);

  async function archivo() {
    const blob = await pngDe(canvas.current!);
    return new File([blob], `veloo-${slug}.png`, { type: "image/png" });
  }

  function descargar(f: File) {
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function compartir() {
    setAviso(undefined);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Sin portapapeles: el link sigue visible arriba para copiarlo a mano.
    }
    const f = await archivo();
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f] });
      } catch {
        // Cerró la hoja de compartir: no es un error.
      }
    } else {
      descargar(f);
      setAviso("Copiamos el link y guardamos la imagen. Súbela como historia desde Instagram.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <span className="grid size-6 place-items-center rounded-full bg-ok-soft text-ok">
          <CheckIcon weight="bold" size={12} />
        </span>
        <h1 className="m-0 flex-1 truncate text-base font-semibold">{titulo} está listo</h1>
        <Link href="/app/boveda" aria-label="Cerrar" className="-mr-2.5 grid size-11 place-items-center text-text!">
          <XIcon weight="bold" size={20} />
        </Link>
      </header>

      <DatoCopiable valor={link} mostrar={linkVisible(usuario, slug)} className="px-5" />

      <div className="flex items-start gap-3.5 px-5 pt-[18px]">
        {/* Inclinada a propósito: es la tarjeta que se lleva a Instagram. */}
        <canvas
          ref={canvas}
          aria-label={`Vista previa de la historia, estilo ${ESTILOS[estilo].nombre}`}
          className="h-[345px] w-[194px] flex-none -rotate-2 rounded-[14px] border border-line"
        />
        <div role="radiogroup" aria-label="Estilo" className="flex flex-1 flex-col gap-2">
          <span className="text-[13px] font-semibold">Estilo</span>
          {ESTILOS.map((e, i) => (
            <button
              key={e.nombre}
              type="button"
              role="radio"
              aria-checked={i === estilo}
              onClick={() => setEstilo(i)}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border-[1.5px] bg-surface px-3 text-sm font-semibold text-text",
                i === estilo ? "border-accent" : "border-line",
              )}
            >
              <span className="size-[22px] flex-none rounded-full border border-line" style={{ background: e.fondo }} />
              {e.nombre}
            </button>
          ))}
        </div>
      </div>

      <p className="m-0 px-5 pt-3.5 text-[13px] leading-normal text-pretty text-muted">
        Al compartir copiamos el link. En Instagram agrega el sticker “Enlace”, pégalo y colócalo sobre el recuadro.
      </p>

      <ZonaCTA>
        {aviso && <p className="m-0 text-[13px] font-semibold text-ok">{aviso}</p>}
        <Boton onClick={compartir} icono={<InstagramLogoIcon weight="bold" size={18} />}>
          Compartir en Instagram
        </Boton>
        <Boton variante="secundario" onClick={async () => descargar(await archivo())}>
          Guardar imagen
        </Boton>
      </ZonaCTA>
    </main>
  );
}

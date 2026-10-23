"use client";

import { CheckIcon, InstagramLogoIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Boton, DatoCopiable, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dibujarHistoria, ESTILOS, pngDe, type DatosHistoria } from "@/lib/historia";
import { linkPublico } from "@/lib/links";
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
  const [lista, setLista] = useState(false);
  const [ocupada, setOcupada] = useState(false);
  const [error, setError] = useState<string>();
  const origen = useOrigen();
  const link = linkPublico(usuario, slug, origen);

  useEffect(() => {
    let vigente = true;
    const temporal = document.createElement("canvas");
    dibujarHistoria(temporal, ESTILOS[estilo], historia).then(() => {
      if (!vigente || !canvas.current) return;
      canvas.current.width = temporal.width;
      canvas.current.height = temporal.height;
      canvas.current.getContext("2d")?.drawImage(temporal, 0, 0);
      setLista(true);
    }).catch(() => {
      if (vigente) setError("No pudimos preparar la imagen. Tu set sigue publicado; puedes copiar su enlace o elegir otro estilo para intentar de nuevo.");
    });
    return () => { vigente = false; };
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
    setOcupada(true);
    let copiado = false;
    try {
      await navigator.clipboard.writeText(link);
      copiado = true;
    } catch {
      // Sin portapapeles: el link sigue visible arriba para copiarlo a mano.
    }
    try {
      const f = await archivo();
      if (navigator.canShare?.({ files: [f] })) {
        try {
          await navigator.share({ files: [f] });
        } catch {
          setAviso(copiado ? "El enlace quedó copiado. Puedes volver a compartir la imagen cuando quieras." : "Puedes copiar el enlace con el botón de arriba y volver a compartir.");
        }
      } else {
        descargar(f);
        setAviso(copiado ? "Enlace copiado e imagen guardada. Abre Instagram, sube la imagen y pega el enlace en el sticker Enlace." : "Imagen guardada. Copia el enlace con el botón de arriba antes de abrir Instagram.");
      }
    } catch {
      setError("No pudimos guardar la imagen. Tu set sigue publicado; vuelve a intentar o comparte su enlace.");
    } finally {
      setOcupada(false);
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

      <section className="flex flex-col gap-3 px-5 pt-3">
        <h2 className="m-0 font-display text-[26px] font-semibold">Comparte tu set</h2>
        <p className="m-0 text-sm text-muted">1. Copia este enlace. Lleva directo a las fotos que acabas de publicar.</p>
        <DatoCopiable destacado label="Enlace para comprar este set" valor={link} />
        <p className="mb-0 mt-3 text-sm font-semibold">2. Elige la imagen para tu historia</p>
      </section>

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
              onClick={() => { if (i !== estilo) { setLista(false); setError(undefined); setEstilo(i); } }}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border-[1.5px] bg-surface px-3 text-sm font-semibold text-text",
                i === estilo ? "border-accent bg-accent-soft!" : "border-line",
              )}
            >
              <span className="size-[22px] flex-none rounded-full border border-line" style={{ background: e.fondo }} />
              {e.nombre}
              {i === estilo && <CheckIcon size={18} weight="bold" className="ml-auto text-accent-ink" aria-hidden />}
            </button>
          ))}
        </div>
      </div>

      <p className="m-0 px-5 pt-3.5 text-[13px] leading-normal text-pretty text-muted">
        3. Guarda o comparte la imagen. En tu historia de Instagram agrega el sticker “Enlace” y pega el enlace del set. La imagen por sí sola no lleva a la compra.
      </p>

      <ZonaCTA>
        {error && <p role="alert" className="m-0 text-[13px] text-bad">{error}</p>}
        {aviso && <p className="m-0 text-[13px] font-semibold text-ok">{aviso}</p>}
        <Boton onClick={compartir} disabled={!lista || ocupada} icono={<InstagramLogoIcon weight="bold" size={18} />}>
          {ocupada ? "Preparando…" : !lista ? "Preparando imagen…" : "Compartir imagen y copiar enlace"}
        </Boton>
        <Boton variante="secundario" disabled={!lista || ocupada} onClick={async () => { try { descargar(await archivo()); } catch { setError("No pudimos guardar la imagen. Tu set sigue publicado; vuelve a intentar."); } }}>
          Guardar imagen
        </Boton>
      </ZonaCTA>
    </main>
  );
}

"use client";

import { CheckIcon, DotsThreeIcon, ExportIcon, LockIcon, PlusSquareIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import { Boton, Segmentado } from "@/components/ui";

type Plataforma = "ios" | "android";
type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Después de comprar o de crear cuenta:
 * - Dentro del navegador de Instagram → P1 (abrir en el navegador para poder instalar).
 * - En el navegador normal → P2 (agregar a inicio).
 */
export function Guardar({
  siguiente,
  host,
  instagram,
  plataforma: inicial,
}: {
  siguiente: string;
  host: string;
  instagram: boolean;
  plataforma: Plataforma;
}) {
  const [copiado, setCopiado] = useState(false);
  const [plataforma, setPlataforma] = useState<Plataforma>(inicial);
  const [evento, setEvento] = useState<EventoInstalar | null>(null);

  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    window.addEventListener("beforeinstallprompt", guardar);
    return () => window.removeEventListener("beforeinstallprompt", guardar);
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(new URL(siguiente, window.location.origin).toString());
      setCopiado(true);
    } catch {
      // Sin portapapeles: la instrucción de "Abrir en navegador" sigue sirviendo.
    }
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    window.location.href = siguiente;
  }

  if (instagram) {
    return (
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
        <header className="flex min-h-12 items-center gap-2.5 border-b border-line px-[18px] text-[13px] text-muted">
          <XIcon weight="bold" size={18} />
          <span className="flex-1 text-center font-mono text-xs">{host}</span>
          <span className="grid size-8 place-items-center rounded-full border-2 border-accent text-text">
            <DotsThreeIcon weight="bold" size={18} />
          </span>
        </header>
        {/* Flecha hacia el menú de Instagram, hecha a mano. */}
        <span aria-hidden className="absolute top-[58px] right-[30px] h-[60px] w-0.5 bg-accent" />
        <section className="flex flex-col gap-3 px-7 pt-[90px]">
          <span className="flex items-center gap-2 text-sm font-bold text-ok">
            <CheckIcon weight="bold" size={16} />
            Compra lista
          </span>
          <h1 className="m-0 font-display text-[26px] leading-[1.15] font-semibold tracking-[-0.01em]">Guárdalo en tu teléfono</h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            Toca <b className="text-text">los tres puntos</b> arriba a la derecha y elige <b className="text-text">Abrir en navegador</b>. Desde ahí lo
            agregas a tu inicio como una app.
          </p>
        </section>
        <div className="mt-auto flex flex-col gap-2.5 px-5 pt-3 pb-6">
          <Boton onClick={copiar}>{copiado ? "Link copiado: pégalo en tu navegador" : "Copiar link en su lugar"}</Boton>
          <Boton variante="texto" tono="apagado" href={siguiente} className="font-medium">
            Ahora no, ver mi compra
          </Boton>
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <div className="flex justify-center px-5 py-4">
        <Segmentado
          label="Teléfono"
          className="w-[220px]"
          valor={plataforma}
          onChange={setPlataforma}
          opciones={[
            { valor: "ios", label: "iPhone" },
            { valor: "android", label: "Android" },
          ]}
        />
      </div>
      <div className="mx-4 flex-1 rounded-[26px] bg-surface-2 opacity-60" />

      {plataforma === "ios" ? (
        <section className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-[28px] bg-surface px-6 pt-6 pb-7 shadow-frame">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-[12px] bg-text text-bg">
              <LockIcon weight="bold" size={22} />
            </span>
            <div>
              <h1 className="m-0 text-[17px] font-semibold">Agrega veloo a tu inicio</h1>
              <p className="m-0 text-[13px] text-muted">Se abre como app, sin barra del navegador</p>
            </div>
          </div>
          <Paso n={1} icono={<ExportIcon weight="bold" size={22} className="text-accent-ink" />}>
            Toca Compartir
          </Paso>
          <Paso n={2} icono={<PlusSquareIcon weight="bold" size={22} className="text-accent-ink" />}>
            Elige <b>Agregar a inicio</b>
          </Paso>
          <p className="m-0 text-center text-[13px] text-muted">El botón está en la barra de Safari</p>
          <Boton variante="texto" tono="apagado" href={siguiente} className="font-medium">
            Listo
          </Boton>
        </section>
      ) : (
        <section className="absolute inset-x-4 bottom-7 flex flex-col gap-4 rounded-[24px] bg-surface p-[22px] shadow-frame">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-text text-bg">
              <LockIcon weight="bold" size={22} />
            </span>
            <div>
              <h1 className="m-0 text-[17px] font-semibold">¿Instalar veloo?</h1>
              <p className="m-0 text-[13px] text-muted">{evento ? "Se abre como app, sin barra del navegador" : "Abre el menú del navegador y elige Instalar app"}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Boton variante="texto" tono="apagado" href={siguiente} className="font-medium">
              {evento ? "Cancelar" : "Listo"}
            </Boton>
            {evento && (
              <button type="button" onClick={instalar} className="grid min-h-11 cursor-pointer place-items-center rounded-full bg-text px-5 text-[15px] font-semibold text-bg">
                Instalar
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function Paso({ n, icono, children }: { n: number; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[15px]">
      <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold">{n}</span>
      <span className="flex-1">{children}</span>
      {icono}
    </div>
  );
}

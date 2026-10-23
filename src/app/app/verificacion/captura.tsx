"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Boton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { reducirJpeg } from "@/lib/imagen";
import { iniciarIntento, terminarIntento } from "./acciones";

type Pieza = "ine_frente" | "ine_reverso" | "selfie";

const PASOS: { pieza: Pieza; titulo: string; ayuda: string; camara: "environment" | "user" }[] = [
  { pieza: "ine_frente", titulo: "Frente de tu INE", ayuda: "Ponla sobre una superficie oscura, con buena luz y sin reflejos.", camara: "environment" },
  { pieza: "ine_reverso", titulo: "Reverso de tu INE", ayuda: "Ponla sobre una superficie oscura, con buena luz y sin reflejos.", camara: "environment" },
  { pieza: "selfie", titulo: "Ahora tú", ayuda: "Sin lentes oscuros ni gorra. Comparamos tu cara con la de la INE.", camara: "user" },
];

async function subir(url: string, foto: Blob) {
  const r = await fetch(url, { method: "PUT", headers: { "content-type": "image/jpeg", "x-upsert": "true" }, body: foto });
  if (!r.ok) throw new Error();
}

/** C2 / C2b · Captura de INE (frente y reverso) y selfie. Pantallas oscuras, como la cámara. */
export function Captura({ otraVez }: { otraVez: string | null }) {
  const entrada = useRef<HTMLInputElement>(null);
  const intento = useRef<{ intentoId: string; urls: Record<Pieza, string> } | null>(null);
  const [paso, setPaso] = useState(0);
  const [vistas, setVistas] = useState<Partial<Record<Pieza, string>>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string>();
  const [terminando, iniciar] = useTransition();
  const actual = PASOS[paso];
  const lista = PASOS.every((p) => vistas[p.pieza]);

  async function tomar(archivo: File | undefined) {
    if (!archivo) return;
    setError(undefined);
    setSubiendo(true);
    try {
      if (!intento.current) {
        const r = await iniciarIntento();
        if (!r.ok) throw new Error(r.error);
        intento.current = r;
      }
      const foto = await reducirJpeg(archivo, 2000);
      await subir(intento.current.urls[actual.pieza], foto);
      setVistas((v) => ({ ...v, [actual.pieza]: URL.createObjectURL(foto) }));
      if (paso < PASOS.length - 1) setPaso(paso + 1);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "No se pudo subir la foto. Revisa tu conexión y tómala otra vez.");
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  function enviar() {
    if (!intento.current) return;
    setError(undefined);
    iniciar(async () => {
      const r = await terminarIntento(intento.current!.intentoId);
      if (r?.error) setError(r.error);
    });
  }

  const vista = vistas[actual.pieza];

  return (
    <main data-tema="oscuro" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg text-text">
      <div className="grid grid-cols-3 gap-1.5 px-5 pt-5" aria-label={`Paso ${paso + 1} de 3`}>
        {PASOS.map((p, i) => (
          <span key={p.pieza} className={cn("h-[3px] rounded-sm", i <= paso ? "bg-accent" : "bg-line")} />
        ))}
      </div>

      <div className="flex items-start gap-1 px-5 pt-3">
        {paso > 0 ? (
          <button type="button" onClick={() => setPaso(paso - 1)} aria-label="Paso anterior" className="-ml-2.5 grid size-11 cursor-pointer place-items-center text-text">
            <CaretLeftIcon weight="bold" size={20} />
          </button>
        ) : (
          <Link href="/app/boveda" aria-label="Salir" className="-ml-2.5 grid size-11 place-items-center text-text!">
            <CaretLeftIcon weight="bold" size={20} />
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-6">
        <h1 className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em]">{actual.titulo}</h1>
        <p className="m-0 text-sm text-muted">{otraVez && paso === 0 ? otraVez : actual.ayuda}</p>
      </div>

      {actual.pieza === "selfie" ? (
        <div className="relative mx-auto mt-10 h-[330px] w-[250px] overflow-hidden rounded-[50%] border-[3px] border-accent bg-surface-2">
          {vista && <div role="img" aria-label="Tu selfie" className="size-full bg-cover bg-center" style={{ backgroundImage: `url("${vista}")` }} />}
        </div>
      ) : (
        <div className="relative mx-7 mt-12 aspect-[1.586] overflow-hidden rounded-[22px] border-[2.5px] border-accent bg-surface-2">
          {vista ? (
            <div role="img" aria-label={actual.titulo} className="size-full bg-cover bg-center" style={{ backgroundImage: `url("${vista}")` }} />
          ) : (
            <div aria-hidden className="absolute inset-3.5 rounded-[12px] bg-surface" />
          )}
        </div>
      )}

      <p className={cn("m-0 mt-[18px] px-6 text-center text-sm font-medium", error ? "text-bad" : "text-warn")}>
        {error ?? (subiendo ? "Subiendo…" : vista ? "Lista. Puedes tomarla otra vez." : "Toca el botón para tomar la foto")}
      </p>

      <div className="mt-auto flex flex-col items-center gap-3 px-5 pb-10">
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          capture={actual.camara}
          className="hidden"
          onChange={(e) => tomar(e.target.files?.[0])}
        />
        {lista ? (
          <Boton onClick={enviar} disabled={terminando}>
            {terminando ? "Enviando…" : "Enviar a revisión"}
          </Boton>
        ) : null}
        <button
          type="button"
          aria-label={vista ? "Tomarla otra vez" : "Tomar foto"}
          disabled={subiendo || terminando}
          onClick={() => entrada.current?.click()}
          className="grid size-[76px] cursor-pointer place-items-center rounded-full border-4 border-text disabled:opacity-40"
        >
          <span className="size-[60px] rounded-full bg-text" />
        </button>
      </div>
    </main>
  );
}

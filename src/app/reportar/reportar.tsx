"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Boton, Campo, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { enviarReporte, type MotivoReporte } from "./acciones";

const RAZONES: { motivo: MotivoReporte; label: string; urgente: boolean }[] = [
  { motivo: "sin_consentimiento", label: "Aparezco sin haberlo aceptado", urgente: true },
  { motivo: "posible_menor", label: "Puede ser menor de edad", urgente: true },
  { motivo: "contenido_prohibido", label: "Tiene desnudos o contenido sexual", urgente: false },
  { motivo: "contenido_robado", label: "Es contenido robado de otra persona", urgente: false },
  { motivo: "datos_personales", label: "Muestra datos personales", urgente: false },
  { motivo: "otro", label: "Otra cosa", urgente: false },
];

/** R1 · Reportar. Sin cuenta; los urgentes ocultan el set de inmediato. */
export function Reportar({ setId, usuario }: { setId?: string; usuario?: string }) {
  const router = useRouter();
  const [razon, setRazon] = useState(0);
  const [correo, setCorreo] = useState("");
  const [folio, setFolio] = useState<string>();
  const [error, setError] = useState<string>();
  const [enviando, iniciar] = useTransition();
  const urgente = RAZONES[razon].urgente;

  function enviar() {
    setError(undefined);
    iniciar(async () => {
      const r = await enviarReporte({ setId, usuario, motivo: RAZONES[razon].motivo, correo });
      if (r.ok) setFolio(r.folio);
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <button type="button" onClick={() => router.back()} aria-label="Cerrar" className="-ml-2.5 grid size-11 cursor-pointer place-items-center text-text">
          <XIcon weight="bold" size={20} />
        </button>
        <span className="flex-1 text-base font-bold">Reportar</span>
      </header>

      {folio ? (
        <>
          <section className="flex flex-col gap-2.5 px-6 pt-[60px]">
            <span className="flex items-center gap-2 text-sm font-bold text-ok">
              <CheckIcon weight="bold" size={18} />
              Reporte <span className="font-mono">{folio}</span> recibido
            </span>
            <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">{urgente ? "Ya lo ocultamos" : "Lo vamos a revisar"}</h1>
            <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
              {urgente
                ? "El set dejó de verse mientras lo revisamos, en menos de 1 hora. Si eres tú quien aparece, te pediremos identificarte para retirarlo de forma definitiva."
                : "Una persona del equipo lo revisa en menos de 24 horas. Si dejaste tu correo, te contamos qué decidimos."}
            </p>
          </section>
          <ZonaCTA>
            <Boton variante="secundario" onClick={() => router.back()}>
              Listo
            </Boton>
          </ZonaCTA>
        </>
      ) : (
        <>
          <h1 className="m-0 px-6 pt-1 font-display text-[26px] leading-[1.15] font-semibold">¿Qué está pasando?</h1>
          <div role="radiogroup" aria-label="Motivo" className="flex flex-col gap-2 px-5 pt-[18px]">
            {RAZONES.map((r, i) => (
              <button
                key={r.motivo}
                type="button"
                role="radio"
                aria-checked={i === razon}
                onClick={() => setRazon(i)}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-[22px] border-[1.5px] bg-surface px-[18px] text-left text-[15px] font-semibold text-text",
                  i === razon ? "border-accent" : "border-line",
                )}
              >
                <span className="flex-1 leading-[1.3]">{r.label}</span>
                {r.urgente && <span className="text-xs font-bold whitespace-nowrap text-bad">Se oculta ya</span>}
              </button>
            ))}
          </div>
          <Campo
            label="Correo para darte respuesta · opcional"
            className="px-5 pt-3.5"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <ZonaCTA>
            {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
            <Boton onClick={enviar} disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar reporte"}
            </Boton>
          </ZonaCTA>
        </>
      )}
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Encabezado } from "@/components/creadora/encabezado";
import { Boton, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { guardarPaises } from "../acciones";

const PAISES: [string, string][] = [
  ["MX", "México"],
  ["US", "Estados Unidos"],
  ["CO", "Colombia"],
  ["AR", "Argentina"],
  ["CL", "Chile"],
  ["PE", "Perú"],
  ["EC", "Ecuador"],
  ["GT", "Guatemala"],
  ["VE", "Venezuela"],
  ["DO", "República Dominicana"],
  ["ES", "España"],
  ["CA", "Canadá"],
];

/** Países donde su página no se muestra (para que no la vea gente de su ciudad o familia). */
export function Paises({ iniciales }: { iniciales: string[] }) {
  const router = useRouter();
  const [elegidos, setElegidos] = useState(new Set(iniciales));
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();

  function alternar(codigo: string) {
    setElegidos((s) => {
      const n = new Set(s);
      if (n.has(codigo)) n.delete(codigo);
      else n.add(codigo);
      return n;
    });
  }

  function guardar() {
    setError(undefined);
    iniciar(async () => {
      const r = await guardarPaises([...elegidos]);
      if (r.ok) router.push("/app/perfil");
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/perfil" titulo="Bloquear países" />
      <p className="m-0 px-6 text-sm leading-normal text-pretty text-muted">
        Quien entre desde estos países no verá tu página ni tus sets. Lo que ya compraron sigue disponible para ellos.
      </p>
      <div className="flex flex-wrap gap-1.5 px-5 pt-5">
        {PAISES.map(([codigo, nombre]) => {
          const activo = elegidos.has(codigo);
          return (
            <button
              key={codigo}
              type="button"
              aria-pressed={activo}
              onClick={() => alternar(codigo)}
              className={cn(
                "grid min-h-9 cursor-pointer place-items-center rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap",
                activo ? "bg-text text-bg" : "bg-surface-2 text-text",
              )}
            >
              {nombre}
            </button>
          );
        })}
      </div>
      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : elegidos.size ? `Bloquear ${elegidos.size === 1 ? "1 país" : `${elegidos.size} países`}` : "Guardar"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

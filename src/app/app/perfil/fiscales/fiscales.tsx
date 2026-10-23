"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Encabezado } from "@/components/creadora/encabezado";
import { Boton, Campo, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { guardarFiscales } from "../acciones";

// Regímenes del catálogo del SAT que aplican a personas físicas que venden en plataformas.
const REGIMENES = [
  ["625", "Plataformas tecnológicas"],
  ["626", "Régimen Simplificado de Confianza (RESICO)"],
  ["612", "Actividades empresariales y profesionales"],
  ["605", "Sueldos y salarios"],
  ["616", "Sin obligaciones fiscales"],
] as const;

/** Datos fiscales para el CFDI mensual de la comisión de Veloo. */
export function Fiscales({ rfc: r, regimen: g, cp: c }: { rfc: string; regimen: string; cp: string }) {
  const router = useRouter();
  const [rfc, setRfc] = useState(r);
  const [regimen, setRegimen] = useState(g);
  const [cp, setCp] = useState(c);
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();

  function guardar() {
    setError(undefined);
    iniciar(async () => {
      const x = await guardarFiscales({ rfc, regimen, cp });
      if (x.ok) router.push("/app/perfil");
      else setError(x.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/perfil" titulo="Datos fiscales" />
      <p className="m-0 px-6 text-sm leading-normal text-pretty text-muted">
        Cada mes te mandamos la factura (CFDI) de la comisión de Veloo. Usa los datos de tu constancia de situación fiscal.
      </p>
      <div className="flex flex-col gap-4 px-5 pt-[22px]">
        <Campo
          label="RFC"
          mono
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, "").slice(0, 13))}
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="RUVA990314AB1"
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="regimen" className="text-[13px] font-semibold">
            Régimen fiscal
          </label>
          <select
            id="regimen"
            value={regimen}
            onChange={(e) => setRegimen(e.target.value)}
            className={cn(
              "min-h-[50px] w-full appearance-none rounded-full border border-line bg-surface px-[18px] text-base font-medium outline-none",
              "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
              !regimen && "text-muted",
            )}
          >
            <option value="" disabled>
              Elige tu régimen
            </option>
            {REGIMENES.map(([codigo, nombre]) => (
              <option key={codigo} value={codigo}>
                {codigo} · {nombre}
              </option>
            ))}
          </select>
        </div>
        <Campo
          label="Código postal fiscal"
          mono
          inputMode="numeric"
          value={cp}
          onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))}
          placeholder="68000"
        />
      </div>
      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={guardar} disabled={guardando || rfc.length < 12 || !regimen || cp.length !== 5}>
          {guardando ? "Guardando…" : "Guardar"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

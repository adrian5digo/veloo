"use client";

import Link from "next/link";
import { useEffect, useId, useState, useTransition } from "react";
import { Boton, Campo, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { registrar, revisarUsuario, type Disponibilidad } from "./acciones";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const pill =
  "min-h-[50px] w-full min-w-0 rounded-full border border-line bg-surface px-[18px] text-base font-medium text-text outline-none " +
  "focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]";

const AVISO: Record<Disponibilidad, { texto: string; clase: string }> = {
  disponible: { texto: "Disponible", clase: "text-ok" },
  ocupado: { texto: "Ocupado", clase: "text-bad" },
  invalido: { texto: "No válido", clase: "text-bad" },
};

/** C1b · Registro. Ya entró con su correo (L1); aquí elige su link y confirma su edad. */
export function Registro({ correo, dominio }: { correo: string; dominio: string }) {
  const idLink = useId();
  const [usuario, setUsuario] = useState("");
  const [revisado, setRevisado] = useState<{ usuario: string; estado: Disponibilidad }>();
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string>();
  const [enviando, iniciar] = useTransition();

  useEffect(() => {
    if (usuario.length < 3) return;
    const t = setTimeout(async () => setRevisado({ usuario, estado: await revisarUsuario(usuario) }), 400);
    return () => clearTimeout(t);
  }, [usuario]);

  const disponibilidad = revisado?.usuario === usuario ? revisado.estado : undefined;
  const listo = disponibilidad === "disponible" && dia && mes && anio.length === 4 && acepta;

  function continuar() {
    setError(undefined);
    iniciar(async () => {
      const r = await registrar({ usuario, dia: Number(dia), mes: Number(mes), anio: Number(anio), acepta });
      if (r?.error) setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <div className="flex flex-col gap-1.5 px-6 pt-10">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.01em]">Crea tu cuenta</h1>
        <p className="m-0 text-sm text-muted">Elige tu link. Es lo que vas a pegar en tus historias.</p>
      </div>

      <div className="flex flex-col gap-4 px-5 pt-6">
        <Campo label="Correo" value={correo} bloqueado readOnly />

        <div className="flex flex-col gap-2">
          <label htmlFor={idLink} className="text-[13px] font-semibold">
            Tu link
          </label>
          <div className={cn(pill, "flex items-center focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]")}>
            <input
              id={idLink}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30))}
              placeholder="tunombre"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              size={Math.max(usuario.length, 8)}
              className="min-w-0 bg-transparent text-base font-medium outline-none placeholder:text-muted"
            />
            <span className="text-muted">.{dominio}</span>
            {disponibilidad && (
              <span className={cn("ml-auto pl-2 text-xs font-semibold whitespace-nowrap", AVISO[disponibilidad].clase)}>
                {AVISO[disponibilidad].texto}
              </span>
            )}
          </div>
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-[13px] font-semibold">Fecha de nacimiento</legend>
          <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
            <input
              aria-label="Día"
              inputMode="numeric"
              placeholder="Día"
              value={dia}
              onChange={(e) => setDia(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className={pill}
            />
            <select aria-label="Mes" value={mes} onChange={(e) => setMes(e.target.value)} className={cn(pill, "appearance-none", !mes && "text-muted")}>
              <option value="" disabled>
                Mes
              </option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              aria-label="Año"
              inputMode="numeric"
              placeholder="Año"
              value={anio}
              onChange={(e) => setAnio(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={pill}
            />
          </div>
          <span className="px-1 text-xs text-muted">Debe coincidir con tu INE.</span>
        </fieldset>
      </div>

      <label className="mx-5 mt-5 flex cursor-pointer items-start gap-2.5 text-sm leading-[1.45] text-pretty">
        <input
          type="checkbox"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-px size-5 flex-none accent-accent"
        />
        <span>
          Acepto los <Link href="/terminos">términos para creadoras</Link> y el <Link href="/privacidad">aviso de privacidad</Link>.
        </span>
      </label>

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={continuar} disabled={!listo || enviando}>
          {enviando ? "Guardando…" : "Continuar"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

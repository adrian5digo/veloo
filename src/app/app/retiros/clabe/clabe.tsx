"use client";

import { CheckIcon, ClockIcon, IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useTransition } from "react";
import { Encabezado } from "@/components/creadora/encabezado";
import { Boton, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { clabeValida } from "@/lib/clabe";
import { guardarClabe } from "../acciones";

/** C10 · Cambiar CLABE. El titular sale de la INE y no se edita. */
export function Clabe({ bancos, titular }: { bancos: Record<string, string>; titular: string | null }) {
  const [clabe, setClabe] = useState("");
  const [enviado, setEnviado] = useState<string>();
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();

  const banco = bancos[clabe.slice(0, 3)];
  const completa = clabe.length === 18;
  const ok = completa && !!banco && clabeValida(clabe);
  const mensaje = ok
    ? `${banco} · a tu nombre`
    : completa
      ? banco
        ? "El último dígito no coincide. Revisa la CLABE."
        : "No reconocemos este banco. Revisa los primeros 3 dígitos."
      : clabe.length >= 3 && banco
        ? `${banco} · faltan ${18 - clabe.length} dígitos`
        : `Faltan ${18 - clabe.length} dígitos`;

  function guardar() {
    setError(undefined);
    iniciar(async () => {
      const r = await guardarClabe(clabe);
      if (r.ok) setEnviado(r.correo);
      else setError(r.error);
    });
  }

  if (enviado) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
        <Encabezado atras="/app/retiros" titulo="Cuenta para retiros" />
        <section className="flex flex-col gap-2.5 px-6 pt-6">
          <h1 className="m-0 font-display text-[26px] leading-[1.15] font-semibold">Revisa tu correo</h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            Te mandamos un link a <b className="font-semibold text-text">{enviado}</b>. Al abrirlo se activa la CLABE nueva. Mientras, tu CLABE anterior
            sigue igual y tu saldo no se mueve.
          </p>
        </section>
        <ZonaCTA>
          <Boton variante="secundario" href="/app/retiros">
            Volver a retiros
          </Boton>
        </ZonaCTA>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/retiros" titulo="Cuenta para retiros" />
      <div className="flex flex-col gap-1.5 px-6 pt-1.5">
        <h1 className="m-0 font-display text-[26px] leading-[1.15] font-semibold">Nueva CLABE</h1>
        <p className="m-0 text-sm leading-normal text-muted">Debe estar a tu nombre. No aceptamos cuentas de terceros.</p>
      </div>

      <div className="flex flex-col gap-2 px-5 pt-[22px]">
        <label htmlFor="clabe" className="text-[13px] font-semibold">
          CLABE de 18 dígitos
        </label>
        <input
          id="clabe"
          inputMode="numeric"
          autoComplete="off"
          value={clabe}
          onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
          className={cn(
            "min-h-13 w-full rounded-full border-[1.5px] bg-surface px-[18px] font-mono text-[17px] tracking-[.04em] text-text outline-none",
            ok ? "border-ok" : completa ? "border-bad" : "border-line focus:border-accent",
          )}
        />
        <p className={cn("m-0 flex min-h-5 items-center gap-2 text-[13px] font-bold", ok ? "text-ok" : completa ? "text-bad" : "text-muted")}>
          {ok && <CheckIcon weight="bold" size={16} />}
          {mensaje}
        </p>
      </div>

      <div className="flex flex-col gap-2 px-5 pt-4">
        <span className="text-[13px] font-semibold">Titular</span>
        <div className="flex min-h-[50px] items-center rounded-full border border-line bg-surface-2 px-[18px] text-base text-muted">
          {titular ?? "Se toma de tu INE cuando te verifiquemos"}
          <IdentificationCardIcon weight="bold" size={18} className="ml-auto" />
        </div>
        <span className="px-1 text-xs text-muted">Tomado de tu INE verificada</span>
      </div>

      <div className="mx-5 mt-5 flex gap-2.5 rounded-[22px] bg-warn-soft px-[18px] py-3.5 text-sm leading-[1.45]">
        <ClockIcon weight="bold" size={18} className="mt-px flex-none text-warn" />
        <span>Al cambiarla te pedimos confirmar por correo y los retiros se pausan 24 h. Tu saldo no se mueve.</span>
      </div>

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={guardar} disabled={!ok || !titular || guardando}>
          {guardando ? "Guardando…" : "Guardar y confirmar por correo"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

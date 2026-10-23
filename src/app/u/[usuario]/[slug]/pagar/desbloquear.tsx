"use client";

import { CaretLeftIcon, CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Boton, Velo, ZonaCTA } from "@/components/ui";
import { desbloquear } from "./tokens";

const miles = new Intl.NumberFormat("es-MX");

/** F4 · Desbloquear con tokens. Sin sesión pide entrar; sin saldo manda a comprar y regresa aquí. */
export function Desbloquear({
  setId,
  titulo,
  detalle,
  creadora,
  costo,
  saldo,
  portada,
  volver,
  aqui,
}: {
  setId: string;
  titulo: string;
  detalle: string;
  creadora: string;
  /** Tokens que cuesta (1 token = $1). */
  costo: number;
  /** null = sin sesión. */
  saldo: number | null;
  portada: string | null;
  volver: string;
  /** Esta ruta, para regresar después de entrar o comprar. */
  aqui: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [yendo, iniciar] = useTransition();
  const faltan = saldo === null ? 0 : Math.max(0, costo - saldo);

  function usarTokens() {
    setError(undefined);
    iniciar(async () => {
      const r = await desbloquear(setId);
      if (r.ok) return router.push(r.ir);
      setError(r.error);
      if (r.faltan) router.refresh();
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-[18px] py-2 text-[15px] font-semibold">
        <Link href={volver} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        Desbloquear
      </header>

      <div className="mx-5 mt-1 flex items-center gap-3 rounded-[22px] border border-line bg-surface p-3">
        {portada ? <Velo fuente={{ src: portada }} className="size-12 flex-none rounded-[12px]" /> : <div className="size-12 rounded-[12px] bg-surface-2" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">
            {titulo} · {detalle}
          </div>
          <div className="text-[13px] text-muted">{creadora}</div>
        </div>
      </div>

      <section className="flex flex-col gap-1 px-6 pt-8">
        <span className="text-[13px] text-muted">Cuesta</span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[40px] leading-none font-semibold tracking-[-0.01em]">{miles.format(costo)}</span>
          <span className="text-base font-medium text-muted">tokens</span>
          <CoinsIcon weight="bold" size={22} className="ml-auto -rotate-12 self-center text-accent-ink" aria-hidden />
        </div>
      </section>

      <div className="mx-6 mt-5 flex flex-col border-t border-line pt-3.5 text-sm">
        {saldo === null ? (
          <p className="m-0 leading-normal text-pretty text-muted">Entra con tu correo para usar tus tokens. Si es tu primera vez, se crea tu cuenta ahí mismo.</p>
        ) : (
          <>
            <div className="flex justify-between py-1">
              <span className="text-muted">Tienes</span>
              <span className="font-semibold">{miles.format(saldo)} tokens</span>
            </div>
            {faltan > 0 ? (
              <div className="flex justify-between py-1">
                <span className="text-muted">Te faltan</span>
                <span className="font-semibold text-accent-ink">{miles.format(faltan)} tokens</span>
              </div>
            ) : (
              <div className="flex justify-between py-1">
                <span className="text-muted">Te quedan</span>
                <span className="font-semibold">{miles.format(saldo - costo)} tokens</span>
              </div>
            )}
          </>
        )}
      </div>

      <ZonaCTA className="gap-2">
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        {saldo === null ? (
          <Boton href={`/entrar?siguiente=${encodeURIComponent(aqui)}`}>Entrar para desbloquear</Boton>
        ) : faltan > 0 ? (
          <Boton href={`/tokens?para=${encodeURIComponent(aqui)}`}>Comprar tokens</Boton>
        ) : (
          <Boton onClick={usarTokens} disabled={yendo}>
            {yendo ? "Desbloqueando…" : `Desbloquear por ${miles.format(costo)} tokens`}
          </Boton>
        )}
        <p className="m-0 text-center text-xs text-muted">Es tuyo para siempre: lo ves en Mis compras cuando quieras.</p>
      </ZonaCTA>
    </main>
  );
}

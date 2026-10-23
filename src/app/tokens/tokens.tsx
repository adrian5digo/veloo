"use client";

import { CaretLeftIcon, CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CasillaEdad } from "@/components/fan/casilla-edad";
import { Boton, Estado, OpcionGrande, ZonaCTA } from "@/components/ui";
import type { Database } from "@/lib/database.types";
import { precio, totalMXN } from "@/lib/dinero";
import { fecha } from "@/lib/tiempo";
import { comprarTokens } from "./acciones";

export type Movimiento = { id: number; tokens: number; concepto: string; creadoEn: string };

type Compra = { tokens: number; estado: Database["public"]["Enums"]["estado_compra_tokens"] } | null;

const miles = new Intl.NumberFormat("es-MX");

/** Tokens del fan: saldo, comprar un paquete con Stripe y lo que ha gastado. 1 token = $1 MXN. */
export function Tokens({
  saldo,
  paquetes,
  compra,
  para,
  movimientos,
  disponible,
  mayorDeEdad,
}: {
  saldo: number;
  paquetes: number[];
  compra: Compra;
  /** De dónde vino (el set que quería desbloquear), para regresar al terminar. */
  para: string;
  movimientos: Movimiento[];
  /** Stripe configurado. */
  disponible: boolean;
  /** Ya confirmó tener 18 o más (se pide una vez, antes del primer pago). */
  mayorDeEdad: boolean;
}) {
  const router = useRouter();
  const [paquete, setPaquete] = useState(paquetes[1] ?? paquetes[0]);
  const [error, setError] = useState<string>();
  const [edad, setEdad] = useState(mayorDeEdad);
  const [yendo, iniciar] = useTransition();
  const esperando = compra?.estado === "pendiente";

  // El webhook de Stripe puede tardar unos segundos en llegar después de volver.
  useEffect(() => {
    if (!esperando) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [esperando, router]);

  function comprar() {
    setError(undefined);
    iniciar(async () => {
      const r = await comprarTokens(paquete, para, edad);
      if (r.ok) window.location.assign(r.ir);
      else setError(r.error);
    });
  }

  const listo = compra?.estado === "pagada" && para;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-[18px] py-2 text-[15px] font-semibold">
        <Link href={para || "/mis-compras"} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        Tus tokens
      </header>

      <section className="flex items-end gap-3 px-6 pt-4">
        <div className="flex-1">
          <div className="font-display text-[40px] leading-none font-semibold tracking-[-0.01em]">{miles.format(saldo)}</div>
          <p className="m-0 mt-2 text-sm text-muted">tokens · 1 token = $1. Sirven para desbloquear sets y suscripciones en Veloo.</p>
        </div>
        <CoinsIcon weight="bold" size={40} className="mb-1 -rotate-12 text-accent-ink" aria-hidden />
      </section>

      {compra && (
        <div className="mx-5 mt-5 flex flex-col gap-1 border-y border-line py-3.5">
          {compra.estado === "pendiente" && (
            <>
              <Estado tono="warn">Confirmando tu pago de {compra.tokens} tokens</Estado>
              <p className="m-0 text-sm leading-normal text-pretty text-muted">
                Con tarjeta tarda unos segundos. Si elegiste OXXO, llegan cuando pagues la ficha en tienda (tienes 3 días). Puedes cerrar esta página: no se pierde nada.
              </p>
            </>
          )}
          {compra.estado === "pagada" && <Estado tono="ok">Se sumaron {compra.tokens} tokens</Estado>}
          {(compra.estado === "fallida" || compra.estado === "reembolsada") && (
            <>
              <Estado tono="bad">Ese pago no se completó</Estado>
              <p className="m-0 text-sm leading-normal text-muted">No se te cobró nada y tu saldo sigue igual. Puedes intentar otra vez.</p>
            </>
          )}
        </div>
      )}

      <div role="radiogroup" aria-label="Paquete de tokens" className="flex flex-col gap-2 px-5 pt-6">
        <span className="pb-1 text-[13px] font-semibold">Elige un paquete</span>
        {paquetes.map((p) => (
          <OpcionGrande key={p} seleccionada={paquete === p} onSelect={() => setPaquete(p)} className="min-h-16 justify-between px-[18px]">
            <span className="flex w-full items-baseline justify-between gap-3">
              <span>{miles.format(p)} tokens</span>
              <span className="text-sm font-semibold text-muted">{totalMXN(p)}</span>
            </span>
          </OpcionGrande>
        ))}
      </div>

      {movimientos.length > 0 && (
        <section className="px-5 pt-7 pb-4">
          <h2 className="m-0 pb-1 text-[13px] font-semibold">Movimientos</h2>
          {movimientos.map((m) => (
            <div key={m.id} className="flex items-baseline gap-3 border-b border-line py-3 text-sm last:border-b-0">
              <span className="min-w-0 flex-1 truncate">{m.concepto}</span>
              <span className="text-xs text-muted">{fecha(m.creadoEn)}</span>
              <span className={m.tokens > 0 ? "w-14 text-right font-semibold text-ok" : "w-14 text-right font-semibold"}>
                {m.tokens > 0 ? `+${miles.format(m.tokens)}` : `−${miles.format(-m.tokens)}`}
              </span>
            </div>
          ))}
        </section>
      )}

      <ZonaCTA className="gap-2">
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        {!disponible && <p className="m-0 text-[13px] text-muted">Todavía no podemos cobrar. Vuelve pronto: tu saldo no cambia.</p>}
        {listo ? (
          <>
            <Boton href={para}>Volver al set</Boton>
            <Boton variante="texto" tono="apagado" onClick={comprar} disabled={yendo || !disponible || !edad}>
              Comprar otro paquete
            </Boton>
          </>
        ) : (
          <>
            {!mayorDeEdad && <CasillaEdad marcada={edad} onChange={setEdad} />}
            <Boton onClick={comprar} disabled={yendo || !disponible || !edad}>
              {yendo ? "Abriendo el pago…" : `Comprar ${miles.format(paquete)} tokens · ${precio(paquete)}`}
            </Boton>
          </>
        )}
        <p className="m-0 text-center text-xs leading-normal text-muted">Pagas en Stripe. Los tokens no se cambian por dinero ni se pasan a otra cuenta.</p>
      </ZonaCTA>
    </main>
  );
}

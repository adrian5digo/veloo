"use client";

import { CaretLeftIcon, CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CasillaEdad } from "@/components/fan/casilla-edad";
import { Avatar, Boton, Estado, ZonaCTA } from "@/components/ui";
import { fecha } from "@/lib/tiempo";
import type { Relacion } from "@/server/fan";
import { cancelar, suscribir } from "./acciones";

const miles = new Intl.NumberFormat("es-MX");

/** F9 · Suscribirse con tokens, ver hasta cuándo sigue y cancelar. */
export function Suscripcion({
  creadoraId,
  nombre,
  iniciales,
  avatar,
  sets,
  costo,
  saldo,
  mayorDeEdad,
  actual,
  volver,
  aqui,
}: {
  creadoraId: string;
  nombre: string;
  iniciales: string;
  avatar?: string;
  /** Sets de pago que ya tiene publicados. */
  sets: number;
  /** Tokens al mes. */
  costo: number;
  /** null = sin sesión. */
  saldo: number | null;
  mayorDeEdad: boolean;
  actual: Relacion["suscripcion"];
  volver: string;
  aqui: string;
}) {
  const router = useRouter();
  const [edad, setEdad] = useState(mayorDeEdad);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  const activa = !!actual?.activa;
  const faltan = saldo === null ? 0 : Math.max(0, costo - saldo);

  function ejecutar(accion: () => ReturnType<typeof suscribir>) {
    setError(undefined);
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) {
        setError(r.error);
        if (r.faltan) router.refresh();
        return;
      }
      setCancelando(false);
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-[18px] py-2 text-[15px] font-semibold">
        <Link href={volver} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        Suscripción
      </header>

      <section className="flex items-center gap-3 px-6 pt-4">
        <Avatar iniciales={iniciales} src={avatar} tamano={48} />
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold">{nombre}</div>
          <div className="text-[13px] text-muted">{sets === 1 ? "1 set publicado" : `${sets} sets publicados`}</div>
        </div>
      </section>

      <section className="flex flex-col gap-1 px-6 pt-7">
        <span className="text-[13px] text-muted">Cada mes</span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[40px] leading-none font-semibold tracking-[-0.01em]">{miles.format(costo)}</span>
          <span className="text-base font-medium text-muted">tokens</span>
          <CoinsIcon weight="bold" size={22} className="ml-auto -rotate-12 self-center text-accent-ink" aria-hidden />
        </div>
        <p className="m-0 mt-2 text-sm leading-normal text-pretty text-muted">
          Ves todos sus sets, los de ahora y los que publique, mientras tu suscripción siga. Se renueva sola con tus tokens; si no te alcanzan, se detiene sin cobrarte nada más.
        </p>
      </section>

      {activa && (
        <div className="mx-6 mt-5 flex flex-col gap-1 border-y border-line py-3.5">
          <Estado tono="ok">{actual!.renovar ? `Activa · se renueva el ${fecha(actual!.hasta)}` : `Activa hasta el ${fecha(actual!.hasta)}`}</Estado>
          <p className="m-0 text-sm text-muted">
            {actual!.renovar
              ? `Ese día se descuentan ${miles.format(actual!.tokens)} tokens de tu saldo.`
              : "Cancelaste: no se renueva. Sigues viendo todo hasta esa fecha."}
          </p>
        </div>
      )}

      {!activa && saldo !== null && (
        <div className="mx-6 mt-5 flex flex-col border-t border-line pt-3.5 text-sm">
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
        </div>
      )}

      <ZonaCTA className="gap-2">
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        {saldo === null ? (
          <Boton href={`/entrar?siguiente=${encodeURIComponent(aqui)}`}>Entrar para suscribirme</Boton>
        ) : activa ? (
          <>
            {actual!.renovar ? (
              <Boton href={volver}>Ver sus sets</Boton>
            ) : (
              <Boton onClick={() => ejecutar(() => suscribir(creadoraId, false))} disabled={ocupado}>
                {ocupado ? "Guardando…" : "Volver a renovar cada mes"}
              </Boton>
            )}
            {actual!.renovar &&
              (cancelando ? (
                <div className="flex flex-col gap-1 pt-1">
                  <p className="m-0 text-center text-[13px] text-muted">Sigues viendo todo hasta el {fecha(actual!.hasta)}. No se te devuelven tokens.</p>
                  <div className="flex justify-center gap-2">
                    <Boton variante="texto" tono="apagado" onClick={() => setCancelando(false)}>
                      No, seguir
                    </Boton>
                    <Boton variante="texto" tono="peligro" onClick={() => ejecutar(() => cancelar(creadoraId))} disabled={ocupado}>
                      Sí, cancelar
                    </Boton>
                  </div>
                </div>
              ) : (
                <Boton variante="texto" tono="apagado" onClick={() => setCancelando(true)}>
                  Cancelar suscripción
                </Boton>
              ))}
          </>
        ) : faltan > 0 ? (
          <Boton href={`/tokens?para=${encodeURIComponent(aqui)}`}>Comprar tokens</Boton>
        ) : (
          <>
            {!mayorDeEdad && <CasillaEdad marcada={edad} onChange={setEdad} />}
            <Boton onClick={() => ejecutar(() => suscribir(creadoraId, !mayorDeEdad && edad))} disabled={ocupado || !edad}>
              {ocupado ? "Suscribiendo…" : `Suscribirme por ${miles.format(costo)} tokens`}
            </Boton>
          </>
        )}
        <p className="m-0 text-center text-xs text-muted">Cancelas cuando quieras desde aquí o desde Mis compras.</p>
      </ZonaCTA>
    </main>
  );
}

"use client";

import { BankIcon, CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState, useTransition } from "react";
import { BarraCreadora, Boton } from "@/components/ui";
import type { Database } from "@/lib/database.types";
import { cifra } from "@/lib/dinero";
import { fecha, horaCorta, yaPaso } from "@/lib/tiempo";
import { retirar } from "./acciones";

type EstadoRetiro = Database["public"]["Enums"]["estado_retiro"];

const ESTADO: Record<EstadoRetiro, { label: string; clase: string }> = {
  solicitado: { label: "En camino", clase: "text-warn" },
  en_proceso: { label: "En camino", clase: "text-warn" },
  pagado: { label: "Pagado", clase: "text-muted" },
  fallido: { label: "No llegó · regresó a tu saldo", clase: "text-bad" },
};

const MINIMO = 200;

/** C7 · Retiros: saldo disponible, retenido, CLABE e historial. */
export function Retiros({
  disponible,
  retenido,
  verificada,
  cuenta,
  porConfirmar,
  aviso,
  historial,
}: {
  disponible: number;
  retenido: number;
  verificada: boolean;
  cuenta: { banco: string; clabe: string; pausaHasta: string | null } | null;
  porConfirmar: boolean;
  aviso: "ok" | "invalida" | null;
  historial: { id: string; monto: number; estado: EstadoRetiro; fecha: string }[];
}) {
  const [error, setError] = useState<string>();
  const [hecho, setHecho] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const pausado = !!cuenta?.pausaHasta && !yaPaso(cuenta.pausaHasta);

  const motivo = !verificada
    ? "Para retirar, primero verificamos tu identidad."
    : !cuenta
      ? null
      : pausado
        ? `Cambiaste tu CLABE: los retiros se reanudan ${horaCorta(cuenta.pausaHasta!)}.`
        : disponible < MINIMO
          ? `El retiro mínimo es de $${MINIMO}. Te faltan ${cifra(MINIMO - disponible)}.`
          : null;

  function pedir() {
    setError(undefined);
    iniciar(async () => {
      const r = await retirar(Math.round(disponible * 100));
      if (r.ok) setHecho(true);
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-1 px-5 pt-[18px]">
        <Link href="/app/ventas" aria-label="Ventas" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-[-0.01em]">Retiros</h1>
      </header>

      {aviso === "ok" && (
        <p className="m-0 mx-5 mt-3 rounded-[22px] bg-ok-soft px-[18px] py-3 text-sm text-ok">
          Confirmaste tu CLABE nueva. Por seguridad, los retiros se pausan 24 h; tu saldo no se movió.
        </p>
      )}
      {aviso === "invalida" && (
        <p className="m-0 mx-5 mt-3 rounded-[22px] bg-bad-soft px-[18px] py-3 text-sm text-bad">
          Ese link de confirmación ya no sirve. Tu CLABE anterior sigue activa; si quieres cambiarla, vuelve a intentarlo.
        </p>
      )}

      <section className="mx-5 mt-4 flex flex-col gap-3.5 rounded-[26px] border border-line bg-surface p-[18px]">
        <div>
          <div className="text-[13px] text-muted">Disponible para retirar</div>
          <div className="font-display text-[38px] font-semibold tracking-[-0.01em]">{cifra(disponible)}</div>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-sm">
          <span className="text-muted">Retenido · se libera en 7 días</span>
          <span className="font-semibold">{cifra(retenido)}</span>
        </div>
        {hecho ? (
          <p className="m-0 text-center text-sm font-semibold text-ok">Listo. Llega a tu cuenta en 1 día hábil.</p>
        ) : cuenta ? (
          <Boton onClick={pedir} disabled={!!motivo || ocupado} className="min-h-13 text-base">
            {ocupado ? "Pidiendo…" : `Retirar ${cifra(disponible)}`}
          </Boton>
        ) : (
          <Boton href="/app/retiros/clabe" className="min-h-13 text-base">
            Agregar mi CLABE
          </Boton>
        )}
        {(error || motivo) && !hecho && <p className="m-0 text-center text-[13px] text-muted">{error ?? motivo}</p>}
      </section>

      {cuenta && (
        <div className="mx-5 mt-3 flex items-center gap-3 rounded-[22px] bg-surface-2 p-3.5">
          <BankIcon weight="bold" size={20} />
          <div className="flex-1 text-sm leading-[1.35]">
            <b className="font-semibold">{cuenta.banco}</b> · <span className="font-mono">{cuenta.clabe}</span>
            <br />
            <span className="text-xs text-muted">{porConfirmar ? "Hay una CLABE nueva esperando que la confirmes por correo" : "Llega en 1 día hábil"}</span>
          </div>
          <Link href="/app/retiros/clabe" className="text-sm font-medium">
            Cambiar
          </Link>
        </div>
      )}

      <section className="flex flex-col px-5 pt-[22px]">
        <h2 className="m-0 mb-1 text-[13px] font-semibold">Historial</h2>
        {historial.length === 0 && <p className="m-0 py-3 text-sm text-muted">Todavía no has retirado.</p>}
        {historial.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-line py-3 text-sm last:border-b-0">
            <div>
              {fecha(r.fecha)}
              <div className={`text-xs ${ESTADO[r.estado].clase}`}>{ESTADO[r.estado].label}</div>
            </div>
            <b className="font-semibold">{cifra(r.monto)}</b>
          </div>
        ))}
      </section>

      <p className="m-0 mt-auto px-5 pt-4 pb-6 text-xs leading-normal text-pretty text-muted">
        Retiro mínimo $200. Emitimos tu CFDI de comisiones cada mes.
      </p>

      <div className="sticky bottom-0">
        <BarraCreadora activa="ventas" />
      </div>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Campo, Estado, type Tono } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Database } from "@/lib/database.types";
import { totalMXN } from "@/lib/dinero";
import { hace } from "@/lib/tiempo";
import { confirmarRecibido } from "./acciones";

type EstadoOrden = Database["public"]["Enums"]["estado_orden"];

export type FilaPago = {
  id: string;
  folio: number;
  concepto: string;
  centavos: number;
  correo: string;
  estado: EstadoOrden;
  creadaEn: string;
  venceEn: string | null;
  set: string;
};

function estadoDe(f: FilaPago): { tono: Tono; label: string } {
  if (f.estado === "pagada") return { tono: "ok", label: "Recibido" };
  const vencida = f.estado === "vencida" || (f.venceEn !== null && new Date(f.venceEn).getTime() < Date.now());
  return vencida ? { tono: "neutro", label: "Venció, puede llegar tarde" } : { tono: "warn", label: "Por confirmar" };
}

/** "vlo 7kq4m" → "VLO7KQ4M"; "$149.00" → 14900. */
function coincide(f: FilaPago, q: string) {
  const limpio = q.trim();
  if (!limpio) return true;
  if (f.concepto.includes(limpio.toUpperCase().replace(/\s/g, ""))) return true;
  if (f.correo.includes(limpio.toLowerCase())) return true;
  const monto = Number(limpio.replace(/[$,\s]|MXN/gi, ""));
  return Number.isFinite(monto) && monto > 0 && Math.round(monto * 100) === f.centavos;
}

const columnas = "grid grid-cols-[130px_120px_minmax(0,1fr)_minmax(0,1.2fr)_110px_190px_230px] items-center gap-3";
const accion = "grid min-h-10 cursor-pointer place-items-center rounded-full px-3.5 text-[13px] font-bold disabled:opacity-40";

/** Cola de transferencias SPEI manuales: se busca el concepto en la banca y se confirma aquí. */
export function Pagos({ filas, clabe }: { filas: FilaPago[]; clabe: string | null }) {
  const [q, setQ] = useState("");
  const [porConfirmar, setPorConfirmar] = useState<string>();
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  const visibles = filas.filter((f) => coincide(f, q));
  const pendientes = filas.filter((f) => f.estado !== "pagada").length;

  function confirmar(id: string) {
    setError(undefined);
    iniciar(async () => {
      const r = await confirmarRecibido(id);
      if (r.error) setError(r.error);
      setPorConfirmar(undefined);
    });
  }

  return (
    <section className="flex min-h-0 flex-col overflow-y-auto">
      <div className="flex items-baseline gap-4 border-b border-line px-7 py-[22px]">
        <h1 className="m-0 flex-1 font-display text-[26px] font-semibold">Pagos por transferencia</h1>
        <span className="text-[13px] text-muted">
          {clabe ? (
            <>
              Llegan a la CLABE <span className="font-mono">•••• {clabe.slice(-4)}</span> ·{" "}
              {pendientes === 1 ? "1 por confirmar" : `${pendientes} por confirmar`}
            </>
          ) : (
            "SPEI manual apagado: falta SPEI_CLABE y SPEI_TITULAR"
          )}
        </span>
      </div>
      <div className="border-b border-line px-7 py-4">
        <Campo
          label="Busca el concepto que viste en la banca, el monto o el correo"
          className="max-w-[460px]"
          mono
          autoComplete="off"
          placeholder="VLO7KQ4M"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {error && <p className="m-0 border-b border-line bg-bad-soft px-7 py-3 text-sm font-bold text-bad">{error}</p>}
      <div className={cn(columnas, "border-b border-line px-7 py-3 text-xs font-bold text-muted")}>
        <span>Concepto</span>
        <span>Monto</span>
        <span>Correo</span>
        <span>Set</span>
        <span>Hace</span>
        <span>Estado</span>
        <span />
      </div>
      {visibles.length === 0 && (
        <p className="m-0 px-7 py-8 text-[15px] leading-normal text-muted">
          {q
            ? "Ningún pago con ese concepto, monto o correo. Si el fan escribió mal el concepto, búscalo por monto y revisa la hora de la transferencia."
            : "Sin transferencias por confirmar."}
        </p>
      )}
      {visibles.map((f) => {
        const { tono, label } = estadoDe(f);
        const abierta = f.estado === "pendiente" || f.estado === "vencida";
        const preguntando = porConfirmar === f.id;
        return (
          <div key={f.id} className={cn(columnas, "border-b border-line px-7 py-3.5 text-sm")}>
            <span className="font-mono text-[15px] font-medium tracking-[.04em]">{f.concepto}</span>
            <span className="font-semibold">{totalMXN(f.centavos / 100).replace(" MXN", "")}</span>
            <span className="truncate font-mono text-[13px] text-muted">{f.correo}</span>
            <span className="truncate text-muted">{f.set}</span>
            <span className="text-muted">{hace(f.creadaEn).replace("hace ", "")}</span>
            <Estado tono={tono}>{label}</Estado>
            <span className="flex justify-end gap-2">
              {abierta &&
                (preguntando ? (
                  <>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => setPorConfirmar(undefined)}
                      className={cn(accion, "border border-line bg-surface text-text")}
                    >
                      No
                    </button>
                    <button type="button" disabled={ocupado} onClick={() => confirmar(f.id)} className={cn(accion, "bg-text text-bg")}>
                      {ocupado ? "Confirmando…" : `Sí, llegó ${totalMXN(f.centavos / 100).replace(" MXN", "")}`}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => setPorConfirmar(f.id)}
                    className={cn(accion, "border border-line bg-surface text-text")}
                  >
                    Recibido
                  </button>
                ))}
            </span>
          </div>
        );
      })}
    </section>
  );
}

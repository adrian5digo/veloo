"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Estado, type Tono } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Database } from "@/lib/database.types";
import { hace } from "@/lib/tiempo";
import { resolver } from "./acciones";

type Motivo = Database["public"]["Enums"]["motivo_reporte"];
type EstadoReporte = Database["public"]["Enums"]["estado_reporte"];

export type FilaReporte = {
  id: string;
  folio: string;
  motivo: Motivo;
  urgente: boolean;
  estado: EstadoReporte;
  creadoEn: string;
  set: string;
  conSet: boolean;
  /** Si reportaron una conversación del inbox: id del reporte para abrirla. */
  conversacion: string | null;
};

const MOTIVO: Record<Motivo, string> = {
  sin_consentimiento: "Aparezco sin haberlo aceptado",
  posible_menor: "Puede ser menor de edad",
  contenido_robado: "Contenido robado",
  datos_personales: "Muestra datos personales",
  contenido_prohibido: "Desnudos o contenido sexual",
  spam: "Spam",
  acoso: "Acoso o insistencia",
  otro: "Otra cosa",
};

function estadoDe(f: FilaReporte): { tono: Tono; label: string } {
  if (f.estado === "set_quitado") return { tono: "bad", label: "Set quitado" };
  if (f.estado === "sin_falta") return { tono: "ok", label: "Sin falta" };
  return f.urgente && f.conSet ? { tono: "warn", label: "Oculto, por revisar" } : { tono: "warn", label: "Por revisar" };
}

const columnas = "grid grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)_150px_160px_220px] items-center gap-3";
const accion = "grid min-h-10 cursor-pointer place-items-center rounded-full px-3.5 text-[13px] font-bold disabled:opacity-40";

/** A4 · Cola de reportes. */
export function Reportes({ filas }: { filas: FilaReporte[] }) {
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  function decidir(id: string, estado: "sin_falta" | "set_quitado") {
    setError(undefined);
    iniciar(async () => {
      const r = await resolver(id, estado);
      if (r.error) setError(r.error);
    });
  }

  return (
    <section className="flex min-h-0 flex-col overflow-y-auto">
      <div className="flex items-baseline gap-4 border-b border-line px-7 py-[22px]">
        <h1 className="m-0 flex-1 font-display text-[26px] font-semibold">Reportes</h1>
        <span className="text-[13px] text-muted">Los de “aparezco sin permiso” y “posible menor” se atienden en menos de 1 h</span>
      </div>
      {error && <p className="m-0 border-b border-line bg-bad-soft px-7 py-3 text-sm font-bold text-bad">{error}</p>}
      <div className={cn(columnas, "border-b border-line px-7 py-3 text-xs font-bold text-muted")}>
        <span>Folio</span>
        <span>Motivo</span>
        <span>Set</span>
        <span>Hace</span>
        <span>Estado</span>
        <span />
      </div>
      {filas.length === 0 && <p className="m-0 px-7 py-8 text-[15px] text-muted">Sin reportes esta semana.</p>}
      {filas.map((f) => {
        const { tono, label } = estadoDe(f);
        const abierto = f.estado === "abierto";
        return (
          <div key={f.id} className={cn(columnas, "border-b border-line px-7 py-3.5 text-sm")}>
            <span className="font-mono text-[13px]">{f.folio}</span>
            <span className="font-bold">{MOTIVO[f.motivo]}</span>
            {f.conversacion ? (
              <Link href={`/panel/reportes/${f.conversacion}`} className="truncate font-bold text-accent-ink!">
                {f.set}
              </Link>
            ) : (
              <span className="truncate text-muted">{f.set}</span>
            )}
            <span className={f.urgente && abierto ? "font-bold text-bad" : "text-muted"}>{hace(f.creadoEn).replace("hace ", "")}</span>
            <Estado tono={tono}>{label}</Estado>
            <span className="flex justify-end gap-2">
              {abierto && (
                <>
                  <button type="button" disabled={ocupado} onClick={() => decidir(f.id, "sin_falta")} className={cn(accion, "border border-line bg-surface text-text")}>
                    Sin falta
                  </button>
                  {f.conSet && (
                    <button type="button" disabled={ocupado} onClick={() => decidir(f.id, "set_quitado")} className={cn(accion, "bg-text text-bg")}>
                      Quitar set
                    </button>
                  )}
                </>
              )}
            </span>
          </div>
        );
      })}
    </section>
  );
}

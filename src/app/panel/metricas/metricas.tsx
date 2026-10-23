"use client";

import { BankIcon, CoinsIcon, CreditCardIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo, useState } from "react";
import { Segmentado } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Database } from "@/lib/database.types";
import { cifra } from "@/lib/dinero";

export type OrdenMetrica = {
  creadora: string;
  metodo: Database["public"]["Enums"]["metodo_pago"];
  contracargo: boolean;
  precio: number;
  comision: number;
  pagadaEn: string;
};

type Rango = "hoy" | "semana" | "mes";
const DIA = 24 * 3600_000;
const DIAS: Record<Rango, number> = { hoy: 1, semana: 7, mes: 30 };
const COMPARA: Record<Rango, string> = { hoy: "ayer", semana: "la semana pasada", mes: "el mes pasado" };
const titulo = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long" });

const METODOS = [
  { metodo: "tarjeta", label: "Tarjeta", icono: CreditCardIcon, color: "bg-text", nota: "Con 3-D Secure" },
  { metodo: "oxxo", label: "OXXO", icono: StorefrontIcon, color: "bg-accent", nota: "Ficha de 72 h" },
  { metodo: "spei", label: "SPEI", icono: BankIcon, color: "bg-muted", nota: "CLABE única por compra" },
  { metodo: "tokens", label: "Tokens", icono: CoinsIcon, color: "bg-accent-ink", nota: "Saldo comprado con Stripe" },
] as const;

/** A3 · Métricas. */
export function Metricas({ ordenes }: { ordenes: OrdenMetrica[] }) {
  const [rango, setRango] = useState<Rango>("hoy");
  const [ahora] = useState(() => Date.now());

  const m = useMemo(() => {
    const dias = DIAS[rango];
    const desde = ahora - dias * DIA;
    const en = (a: number, b: number) => ordenes.filter((o) => {
      const t = new Date(o.pagadaEn).getTime();
      return t >= a && t < b;
    });
    const actuales = en(desde, ahora + 1);
    const previas = en(desde - dias * DIA, desde);
    const gmv = actuales.reduce((t, o) => t + o.precio, 0);
    const gmvPrevio = previas.reduce((t, o) => t + o.precio, 0);
    const n = Math.max(dias === 1 ? 14 : dias, 7);
    const barras = Array.from({ length: n }, (_, i) => en(ahora - (n - i) * DIA, ahora - (n - i - 1) * DIA).reduce((t, o) => t + o.precio, 0));
    const max = Math.max(...barras, 1);
    return {
      gmv,
      cambio: gmvPrevio > 0 ? Math.round(((gmv - gmvPrevio) / gmvPrevio) * 100) : null,
      comision: actuales.filter((o) => !o.contracargo).reduce((t, o) => t + o.comision, 0),
      activas: new Set(actuales.map((o) => o.creadora)).size,
      contracargos: actuales.length ? (actuales.filter((o) => o.contracargo).length / actuales.length) * 100 : 0,
      barras: barras.map((b) => Math.max((b / max) * 100, 3)),
      dias: n,
      mezcla: METODOS.map((x) => ({ ...x, pct: actuales.length ? Math.round((actuales.filter((o) => o.metodo === x.metodo).length / actuales.length) * 100) : 0 })),
    };
  }, [ordenes, rango, ahora]);

  const celda = "border-r border-line px-6 py-5";
  return (
    <section className="flex min-h-0 flex-col gap-7 overflow-y-auto px-8 pt-7 pb-8">
      <div className="flex items-center gap-4">
        <h1 className="m-0 flex-1 font-display text-[26px] font-semibold">
          {rango === "hoy" ? `Hoy, ${titulo.format(ahora)}` : rango === "semana" ? "Últimos 7 días" : "Últimos 30 días"}
        </h1>
        <Segmentado
          label="Rango"
          className="w-[300px]"
          valor={rango}
          onChange={setRango}
          opciones={[
            { valor: "hoy", label: "Hoy" },
            { valor: "semana", label: "7 días" },
            { valor: "mes", label: "Mes" },
          ]}
        />
      </div>

      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-y border-line">
        <div className={cn(celda, "pl-0")}>
          <div className="text-[13px] text-muted">Ventas (GMV)</div>
          <div className="mt-1 font-display text-5xl leading-[1.05] font-semibold">{cifra(m.gmv)}</div>
          <div className={cn("mt-1 text-[13px] font-bold", m.cambio === null ? "text-muted" : m.cambio >= 0 ? "text-ok" : "text-bad")}>
            {m.cambio === null ? `Sin ventas ${COMPARA[rango]} para comparar` : `${m.cambio >= 0 ? "+" : ""}${m.cambio}% vs. ${COMPARA[rango]}`}
          </div>
        </div>
        <div className={celda}>
          <div className="text-[13px] text-muted">Comisión Veloo</div>
          <div className="mt-1 font-display text-[34px] font-semibold">{cifra(m.comision)}</div>
          <div className="mt-1 text-[13px] text-muted">Comisiones registradas, antes de procesamiento</div>
        </div>
        <div className={celda}>
          <div className="text-[13px] text-muted">Creadoras activas</div>
          <div className="mt-1 font-display text-[34px] font-semibold">{m.activas}</div>
          <div className="mt-1 text-[13px] text-muted">vendieron al menos 1 vez</div>
        </div>
        <div className="py-5 pl-6">
          <div className="text-[13px] text-muted">Contracargos</div>
          <div className={cn("mt-1 font-display text-[34px] font-semibold", m.contracargos >= 1 && "text-bad")}>{m.contracargos.toFixed(1)}%</div>
          <div className="mt-1 text-[13px] text-muted">límite del procesador 1.0%</div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-10">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-sm font-bold">GMV por día</h2>
          <div aria-hidden className="flex h-[200px] items-end gap-1.5">
            {m.barras.map((h, i) => (
              <div key={i} className={cn("flex-1 rounded-t-[8px] rounded-b-[3px]", i === m.barras.length - 1 ? "bg-accent" : "bg-surface-2")} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>hace {m.dias} días</span>
            <span>hoy</span>
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <h2 className="m-0 text-sm font-bold">Mezcla de métodos de pago</h2>
          {m.mezcla.map((x) => (
            <div key={x.metodo} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <x.icono weight="bold" size={18} />
                  {x.label}
                </span>
                <b>{x.pct}%</b>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div className={cn("h-full rounded-full", x.color)} style={{ width: `${x.pct}%` }} />
              </div>
              <div className="text-xs text-muted">{x.nota}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

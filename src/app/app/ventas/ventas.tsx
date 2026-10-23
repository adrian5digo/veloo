"use client";

import { BankIcon, ChartBarIcon } from "@phosphor-icons/react/dist/ssr";
import { CabeceraCreadora } from "@/components/creadora/cabecera";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BarraCreadora, Boton, Segmentado } from "@/components/ui";
import type { Database } from "@/lib/database.types";
import { cifra } from "@/lib/dinero";
import { horaCorta } from "@/lib/tiempo";

type Metodo = Database["public"]["Enums"]["metodo_pago"];

export type Venta = {
  id: string;
  folio: number;
  setId: string;
  titulo: string;
  metodo: Metodo;
  estado: Database["public"]["Enums"]["estado_orden"];
  precio: number;
  comision: number;
  neto: number;
  pagadaEn: string;
};

type Periodo = "hoy" | "semana" | "mes";

const DIA = 24 * 3600_000;
const ZONA = "America/Mexico_City";
const diaDe = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** Barras del periodo: hoy en bloques de 4 h, semana y mes por día. */
function cubetas(periodo: Periodo, ahora: number) {
  if (periodo === "hoy") {
    const inicio = new Date(`${diaDe.format(ahora)}T00:00:00`).getTime();
    return Array.from({ length: 6 }, (_, i) => ({ desde: inicio + i * 4 * 3600_000, hasta: inicio + (i + 1) * 4 * 3600_000 }));
  }
  const n = periodo === "semana" ? 7 : 30;
  return Array.from({ length: n }, (_, i) => ({ desde: ahora - (n - i) * DIA, hasta: ahora - (n - i - 1) * DIA }));
}

const METODOS: { metodo: Metodo; label: string; color: string }[] = [
  { metodo: "tarjeta", label: "Tarjeta", color: "bg-text" },
  { metodo: "oxxo", label: "OXXO", color: "bg-accent" },
  { metodo: "spei", label: "SPEI", color: "bg-muted" },
  { metodo: "tokens", label: "Tokens", color: "bg-accent-ink" },
];

export type ResumenSuscripciones = { activas: number; seRenuevan: number; neto30: number };

/** C6 · Ventas. Retiros vive aquí arriba (la pestaña es de Mensajes). */
export function Ventas({
  ventas,
  suscripciones,
  sinLeer,
}: {
  ventas: Venta[];
  suscripciones: ResumenSuscripciones | null;
  sinLeer?: boolean;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [ahora] = useState(() => Date.now());

  const r = useMemo(() => {
    const barras = cubetas(periodo, ahora);
    const desde = barras[0].desde;
    const pagadas = ventas.filter((v) => v.estado === "pagada" && new Date(v.pagadaEn).getTime() >= desde);
    const suma = (k: "neto" | "precio" | "comision") => pagadas.reduce((t, v) => t + v[k], 0);
    const alturas = barras.map((b) =>
      pagadas.filter((v) => {
        const t = new Date(v.pagadaEn).getTime();
        return t >= b.desde && t < b.hasta;
      }).reduce((t, v) => t + v.neto, 0),
    );
    const max = Math.max(...alturas, 1);
    const porSet = new Map<string, { titulo: string; n: number; neto: number }>();
    for (const v of pagadas) {
      const x = porSet.get(v.setId) ?? { titulo: v.titulo, n: 0, neto: 0 };
      porSet.set(v.setId, { ...x, n: x.n + 1, neto: x.neto + v.neto });
    }
    return {
      neto: suma("neto"),
      bruto: suma("precio"),
      comision: suma("comision"),
      n: pagadas.length,
      barras: alturas.map((a) => Math.max((a / max) * 100, 4)),
      mezcla: METODOS.map((m) => ({ ...m, pct: pagadas.length ? Math.round((pagadas.filter((v) => v.metodo === m.metodo).length / pagadas.length) * 100) : 0 })),
      porSet: [...porSet.values()].sort((a, b) => b.neto - a.neto),
      ultimas: ventas.filter((v) => new Date(v.pagadaEn).getTime() >= desde).slice(0, 10),
    };
  }, [ventas, periodo, ahora]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <CabeceraCreadora titulo="Tus ventas" detalle="Sigue lo que vendes y cuánto recibes por cada set." accion={
        <Boton variante="texto" href="/app/retiros" icono={<BankIcon weight="bold" size={18} />} className="-mr-3">
          Retiros
        </Boton>
      } />
      <Segmentado
        label="Periodo"
        className="mx-5 mt-3.5"
        valor={periodo}
        onChange={setPeriodo}
        opciones={[
          { valor: "hoy", label: "Hoy" },
          { valor: "semana", label: "Semana" },
          { valor: "mes", label: "Mes" },
        ]}
      />

      {ventas.length === 0 ? (
        <section className="vacio-creadora">
          <span className="icono-vacio-creadora" aria-hidden="true"><ChartBarIcon size={34} weight="bold" /></span>
          <h2>Tu primera venta tendrá su lugar aquí</h2>
          <p>
            Publica un set y comparte su link con tus fans. Aquí verás tus ventas y el neto que te corresponde después de la comisión del 40%.
          </p>
          <Boton variante="secundario" href="/app/boveda" className="mt-4">
            Ir a mi bóveda
          </Boton>
        </section>
      ) : (
        <>
          <section className="px-5 pt-5">
            <div className="text-[13px] text-muted">Neto para ti</div>
            <div className="font-display text-[40px] font-semibold tracking-[-0.01em]">{cifra(r.neto)}</div>
            <div className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-muted">
              <span>
                Bruto <b className="font-semibold text-text">{cifra(r.bruto)}</b>
              </span>
              <span>
                Comisión <b className="font-semibold text-text">−{cifra(r.comision)}</b>
              </span>
              <span>{r.n === 1 ? "1 venta" : `${r.n} ventas`}</span>
            </div>
          </section>

          <div aria-hidden className="flex h-[92px] items-end gap-1.5 px-5 pt-[18px]">
            {r.barras.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-[6px] rounded-b-[2px] ${i === r.barras.length - 1 ? "bg-accent" : "bg-surface-2"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {r.n > 0 && (
            <section className="flex flex-col gap-2 px-5 pt-5">
              <h2 className="m-0 text-[13px] font-semibold">Método de pago</h2>
              <div className="flex h-2.5 overflow-hidden rounded-[5px]">
                {r.mezcla.map((m) => (
                  <span key={m.metodo} className={m.color} style={{ width: `${m.pct}%` }} />
                ))}
              </div>
              <div className="flex gap-3.5 text-xs text-muted">
                {r.mezcla.map((m) => (
                  <span key={m.metodo} className="flex items-center gap-1.5">
                    <i className={`size-2 rounded-[2px] ${m.color}`} />
                    {m.label} {m.pct}%
                  </span>
                ))}
              </div>
            </section>
          )}

          {suscripciones && (suscripciones.activas > 0 || suscripciones.neto30 > 0) && (
            <section className="flex flex-col px-5 pt-5">
              <h2 className="m-0 mb-1 text-[13px] font-semibold">Suscripciones</h2>
              <div className="flex justify-between border-b border-line py-2.5 text-sm">
                <span>
                  {suscripciones.activas === 1 ? "1 activa" : `${suscripciones.activas} activas`}
                  <span className="block text-xs text-muted">
                    {suscripciones.seRenuevan === suscripciones.activas ? "Todas se renuevan" : `${suscripciones.seRenuevan} se renuevan`}
                  </span>
                </span>
                <span className="text-muted">
                  últimos 30 días · <b className="font-semibold text-text">{cifra(suscripciones.neto30)}</b>
                </span>
              </div>
            </section>
          )}

          {r.porSet.length > 0 && (
            <section className="flex flex-col px-5 pt-5">
              <h2 className="m-0 mb-1 text-[13px] font-semibold">Por link</h2>
              {r.porSet.map((s) => (
                <div key={s.titulo} className="flex justify-between border-b border-line py-2.5 text-sm last:border-b-0">
                  <span>{s.titulo}</span>
                  <span className="text-muted">
                    {s.n} · <b className="font-semibold text-text">{cifra(s.neto)}</b>
                  </span>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col px-5 pt-5 pb-6">
            <h2 className="m-0 mb-1 text-[13px] font-semibold">Últimas</h2>
            {r.ultimas.length === 0 && <p className="m-0 py-2.5 text-sm text-muted">Sin ventas en este periodo.</p>}
            {r.ultimas.map((v) => (
              <Link
                key={v.id}
                href={`/app/ventas/${v.id}`}
                className="flex items-center justify-between border-b border-line py-2.5 text-sm text-text! no-underline last:border-b-0"
              >
                <span>
                  {v.titulo}
                  <span className="block text-xs text-muted">{horaCorta(v.pagadaEn)}</span>
                </span>
                <b className={v.estado === "pagada" ? "font-semibold" : "font-semibold text-bad line-through"}>{cifra(v.neto)}</b>
              </Link>
            ))}
          </section>
        </>
      )}

      <div className="sticky bottom-0 mt-auto">
        <BarraCreadora activa="ventas" sinLeer={sinLeer} />
      </div>
    </main>
  );
}

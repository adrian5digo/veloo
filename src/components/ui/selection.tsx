"use client";

import type { ReactNode } from "react";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

type Opcion<T extends string> = { valor: T; label: string };

/** Fila de chips para filtrar. Activo: ciruela sobre fondo; inactivo: surface-2. */
export function Chips<T extends string>({
  opciones,
  valor,
  onChange,
  label,
  tono = "neutro",
  className,
}: {
  opciones: Opcion<T>[];
  valor: T;
  onChange: (v: T) => void;
  /** Nombre accesible del grupo. */
  label: string;
  /** "neutro" para filtros; "acento" (rosa) para sugerencias que llenan un campo, como los precios. */
  tono?: "neutro" | "acento";
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(o.valor)}
            className={cn(
              "grid min-h-9 cursor-pointer place-items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold",
              tono === "acento" ? (activo ? "bg-accent-ink text-on-accent" : "bg-accent-soft text-accent-ink") : activo ? "bg-text text-bg" : "bg-surface-2 text-text",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Segmentado para periodos (Hoy / Semana / Mes). */
export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
  label,
  className,
}: {
  opciones: Opcion<T>[];
  valor: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-full bg-surface-2 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${opciones.length}, minmax(0, 1fr))` }}
    >
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(o.valor)}
            className={cn(
              "grid min-h-9 cursor-pointer place-items-center rounded-full text-sm text-text",
              activo ? "bg-surface font-semibold" : "font-medium",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Opción grande: método de pago, sí / no. Usar dentro de un role="radiogroup". */
export function OpcionGrande({
  seleccionada,
  onSelect,
  icono,
  children,
  detalle,
  disabled = false,
  className,
}: {
  seleccionada: boolean;
  onSelect: () => void;
  icono?: ReactNode;
  children: ReactNode;
  /** Línea secundaria opcional (ej. "Paga en efectivo en 72 h"). */
  detalle?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-h-[60px] cursor-pointer items-center justify-center gap-2 rounded-[22px] border-[1.5px] px-4 py-2.5 text-[15px] font-bold disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink",
        seleccionada ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-text",
        detalle != null && "flex-col gap-0.5",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {seleccionada ? <CheckCircleIcon size={22} weight="fill" aria-hidden /> : <CircleIcon size={22} weight="bold" aria-hidden />}
        {icono}
        {children}
      </span>
      {detalle && <span className="text-[13px] font-medium text-muted">{detalle}</span>}
    </button>
  );
}

/** Toggle 46×28 para ajustes. */
export function Toggle({
  activo,
  onChange,
  label,
  className,
}: {
  activo: boolean;
  onChange: (v: boolean) => void;
  /** Nombre accesible si no hay texto visible asociado. */
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      onClick={() => onChange(!activo)}
      className={cn(
        "relative h-7 w-[46px] flex-none cursor-pointer rounded-full transition-colors duration-200",
        activo ? "bg-accent" : "bg-line",
        className,
      )}
    >
      <span
        className="absolute top-[3px] size-[22px] rounded-full bg-white transition-[left] duration-200"
        style={{ left: activo ? 21 : 3 }}
      />
    </button>
  );
}

/** Fila de ajuste: texto a la izquierda, toggle a la derecha. */
export function FilaToggle({
  titulo,
  detalle,
  activo,
  onChange,
}: {
  titulo: string;
  detalle?: string;
  activo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3.5">
      <span className="flex-1">
        <span className="block text-[15px] font-bold">{titulo}</span>
        {detalle && <span className="block text-[13px] text-muted">{detalle}</span>}
      </span>
      <Toggle activo={activo} onChange={onChange} label={titulo} />
    </label>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fondo, Velo, type Fuente } from "./veil";

/**
 * Miniatura de la bóveda de la creadora: tiene velo también para ella
 * y se ve nítida solo mientras mantiene presionado.
 */
export function VeloRevelable({
  fuente,
  nitida,
  duracion,
  className,
  children,
}: {
  fuente: Fuente;
  /** Versión nítida; solo se pide al servidor cuando la creadora presiona. */
  nitida: Fuente;
  duracion?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [viendo, setViendo] = useState(false);
  const soltar = () => setViendo(false);

  return (
    <div
      className={cn("relative touch-none select-none", className)}
      onPointerDown={() => setViendo(true)}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onPointerCancel={soltar}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Mantén presionado para ver"
    >
      <Velo fuente={fuente} duracion={duracion} className="size-full">
        {children}
      </Velo>
      {viendo && <div aria-hidden className="absolute inset-0 rounded-[14px]" style={fondo(nitida)} />}
    </div>
  );
}

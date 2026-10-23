"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Marca de agua con el correo del comprador: mono, blanco al 22%, rotada −24°, en mosaico.
 * Con `movil` (video) cambia de posición cada pocos segundos.
 */
export function MarcaDeAgua({
  correo,
  tamano = 12,
  movil = false,
  className,
}: {
  correo: string;
  /** 10 en miniaturas, 12 en vistas grandes. */
  tamano?: 10 | 11 | 12;
  movil?: boolean;
  className?: string;
}) {
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (!movil) return;
    const t = setInterval(() => setPaso((p) => (p + 1) % POSICIONES.length), 4000);
    return () => clearInterval(t);
  }, [movil]);

  const [x, y] = POSICIONES[paso];
  const fila = Array.from({ length: 4 }, () => correo).join("    ");

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-[-50%] grid place-items-center whitespace-pre font-mono leading-[3] text-white/22"
        style={{ fontSize: tamano, transform: `translate(${x}%, ${y}%) rotate(-24deg)` }}
      >
        <div>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ marginLeft: i % 2 ? "4em" : 0 }}>
              {fila}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const POSICIONES: Array<[number, number]> = [
  [0, 0],
  [6, -4],
  [-5, 5],
  [4, 6],
  [-6, -5],
];

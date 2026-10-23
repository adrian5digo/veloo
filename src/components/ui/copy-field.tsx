"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Lo que se copia y se muestra (link, CLABE, referencia). */
  valor: string;
  /** Texto a mostrar si difiere del que se copia (ej. CLABE con espacios). */
  mostrar?: string;
  label?: string;
  className?: string;
};

/** Dato copiable: píldora con texto mono y botón "Copiar" que pasa a "Copiado". */
export function DatoCopiable({ valor, mostrar, label, className }: Props) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-[13px] font-semibold">{label}</span>}
      <div className="flex min-h-13 items-center rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-[18px]">
        <span className="flex-1 truncate font-mono text-[13px]">{mostrar ?? valor}</span>
        <button
          type="button"
          onClick={copiar}
          aria-live="polite"
          className="grid min-h-10 cursor-pointer place-items-center rounded-full bg-surface-2 px-3.5 text-sm font-bold text-text"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

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
  destacado?: boolean;
};

/** Dato copiable: píldora con texto mono y botón "Copiar" que pasa a "Copiado". */
export function DatoCopiable({ valor, mostrar, label, className, destacado = false }: Props) {
  const [copiado, setCopiado] = useState(false);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setFallo(false);
      setCopiado(true);
    } catch {
      setFallo(true);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-[13px] font-semibold">{label}</span>}
      <div className={cn("flex min-h-13 border p-2", destacado ? "flex-col gap-3 rounded-[22px] border-accent bg-accent-soft" : "items-center rounded-full border-line bg-surface pl-[18px]")}>
        <span className={cn("flex-1 font-mono text-[13px]", destacado ? "select-all break-all px-2 pt-2 text-accent-ink" : "truncate")}>{mostrar ?? valor}</span>
        <button
          type="button"
          onClick={copiar}
          aria-live="polite"
          className={cn("grid min-h-11 shrink-0 cursor-pointer place-items-center rounded-full px-3.5 text-sm font-bold", destacado ? "bg-accent-ink text-on-accent" : "bg-surface-2 text-text")}
        >
          {copiado ? "Copiado" : destacado ? "Copiar enlace del set" : "Copiar"}
        </button>
      </div>
      {fallo && <p role="status" className="m-0 text-[13px] text-muted">No pudimos copiarlo. Mantén presionado el enlace para seleccionarlo y copiarlo.</p>}
    </div>
  );
}

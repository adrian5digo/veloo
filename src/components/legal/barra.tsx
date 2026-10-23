"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";

/** Barra de las páginas legales: regresar + la ruta en mono. */
export function BarraLegal({ ruta }: { ruta: string }) {
  const router = useRouter();
  const dominio = process.env.NEXT_PUBLIC_DOMINIO || "veloo.vip";
  return (
    <header className="flex min-h-12 items-center gap-2.5 border-b border-line px-[18px] py-1 text-[13px] text-muted">
      <button type="button" onClick={() => router.back()} aria-label="Regresar" className="-ml-2.5 grid size-11 cursor-pointer place-items-center text-text">
        <CaretLeftIcon weight="bold" size={18} />
      </button>
      <span className="flex-1 truncate text-center font-mono text-xs">
        {dominio}/{ruta}
      </span>
      <span className="w-11" />
    </header>
  );
}

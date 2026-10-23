import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

/** Encabezado de subpantalla: regresar + título 16px, con algo opcional a la derecha. */
export function Encabezado({ atras, titulo, derecha }: { atras: string; titulo: string; derecha?: ReactNode }) {
  return (
    <header className="flex items-center gap-2.5 px-5 py-4">
      <Link href={atras} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
        <CaretLeftIcon weight="bold" size={20} />
      </Link>
      <span className="flex-1 truncate text-base font-bold">{titulo}</span>
      {derecha}
    </header>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Fila de lista: radio 22px, surface, borde, sin sombra.
 * `pendiente` = borde punteado (compra OXXO sin pagar, algo que aún no existe).
 */
export function FilaLista({
  miniatura,
  titulo,
  meta,
  derecha,
  pendiente,
  href,
  className,
}: {
  /** Nodo de 64×64 (normalmente <Velo className="size-16" />). */
  miniatura?: ReactNode;
  titulo: ReactNode;
  meta?: ReactNode;
  /** Precio u otro valor a la derecha. Un string se pinta en Fredoka 17px. */
  derecha?: ReactNode;
  pendiente?: boolean;
  href?: string;
  className?: string;
}) {
  const contenido = (
    <>
      {miniatura && <div className="size-16 flex-none">{miniatura}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold">{titulo}</div>
        {meta && <div className="text-[13px] text-muted">{meta}</div>}
      </div>
      {derecha !== undefined &&
        (typeof derecha === "string" ? (
          <div className="pr-1.5 font-display text-[17px] font-semibold">{derecha}</div>
        ) : (
          derecha
        ))}
    </>
  );

  const clases = cn(
    "flex items-center gap-3.5 rounded-[22px] bg-surface p-2.5 text-text no-underline",
    pendiente ? "border border-dashed border-line" : "border border-line",
    href && "hover:bg-surface-2",
    className,
  );

  return href ? (
    <Link href={href} className={cn(clases, "text-text! hover:text-text!")}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

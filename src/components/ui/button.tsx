import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variante = "primario" | "secundario" | "texto";
type TonoTexto = "acento" | "apagado" | "peligro";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-center no-underline cursor-pointer select-none " +
  "transition-[filter,transform,background-color] duration-100 disabled:opacity-40 disabled:pointer-events-none " +
  "aria-disabled:opacity-40 aria-disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft";

const variantes: Record<Variante, string> = {
  // Uno por pantalla. Es el único lugar donde va el degradado.
  primario:
    "min-h-14 px-6 w-full bg-[image:var(--grad)] text-white! text-[17px] font-bold hover:brightness-105 active:scale-[.98]",
  secundario:
    "min-h-13 px-6 w-full border border-line bg-surface text-text! text-base font-semibold hover:bg-surface-2",
  texto: "min-h-11 px-3 bg-transparent text-[15px] font-bold",
};

const tonosTexto: Record<TonoTexto, string> = {
  acento: "text-accent-ink! hover:text-accent!",
  apagado: "text-muted! hover:text-text!",
  peligro: "text-bad!",
};

type Comun = {
  variante?: Variante;
  /** Solo para variante "texto": acento (default), apagado ("Ahora no") o peligro (destructivo). */
  tono?: TonoTexto;
  icono?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ComoBoton = Comun & Omit<ComponentProps<"button">, keyof Comun> & { href?: undefined };
type ComoLink = Comun & Omit<ComponentProps<typeof Link>, keyof Comun> & { href: string };

export function Boton(props: ComoBoton | ComoLink) {
  const { variante = "primario", tono = "acento", icono, children, className, ...resto } = props;
  const clases = cn(base, variantes[variante], variante === "texto" && tonosTexto[tono], className);
  const contenido = (
    <>
      {icono}
      {children}
    </>
  );

  if (resto.href !== undefined) {
    return (
      <Link {...(resto as Omit<ComoLink, keyof Comun>)} className={clases}>
        {contenido}
      </Link>
    );
  }
  const { type = "button", ...botonProps } = resto as Omit<ComoBoton, keyof Comun>;
  return (
    <button type={type} {...botonProps} className={clases}>
      {contenido}
    </button>
  );
}

/** Zona de CTA al fondo de una pantalla móvil. */
export function ZonaCTA({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-auto flex flex-col gap-2.5 px-5 pt-3 pb-6", className)}>{children}</div>;
}

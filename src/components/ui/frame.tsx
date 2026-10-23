import { LockIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Marco de teléfono 390×844 para lienzos y vistas de escritorio. */
export function MarcoMovil({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[40px] border border-line bg-bg shadow-frame",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Etiqueta encima de una pantalla: código en negrita + nombre. */
export function EtiquetaPantalla({ codigo, children }: { codigo: string; children: ReactNode }) {
  return (
    <div className="text-[13px] text-muted">
      <b className="font-semibold text-text">{codigo}</b> · {children}
    </div>
  );
}

/** Título de pantalla móvil: Fredoka 26px. */
export function TituloPantalla({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cn("m-0 px-5 pt-[22px] font-display text-[26px] font-semibold tracking-[-0.01em]", className)}>
      {children}
    </h1>
  );
}

/** Logo: candado en círculo ciruela + "veloo" en Fredoka 600. Sólido, nunca con degradado. */
export function Logo({ tamano = 32, className }: { tamano?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="grid flex-none place-items-center rounded-full bg-text text-bg"
        style={{ width: tamano, height: tamano }}
      >
        <LockIcon weight="bold" size={tamano / 2} />
      </span>
      <span className="font-display font-semibold" style={{ fontSize: tamano * 0.75 }}>
        veloo
      </span>
    </span>
  );
}

/** Avatar con iniciales o imagen. */
export function Avatar({
  iniciales,
  src,
  tamano = 32,
  className,
}: {
  iniciales: string;
  src?: string;
  tamano?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid flex-none place-items-center overflow-hidden rounded-full border border-line bg-surface-2 font-semibold",
        className,
      )}
      style={{
        width: tamano,
        height: tamano,
        fontSize: Math.round(tamano * 0.34),
        ...(src ? { backgroundImage: `url("${src}")`, backgroundSize: "cover" } : null),
      }}
      aria-label={iniciales}
    >
      {!src && iniciales}
    </span>
  );
}

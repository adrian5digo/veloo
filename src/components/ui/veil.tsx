import { LockIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Placeholders de foto del prototipo. */
export type Placeholder = "ph" | "ph2" | "ph3" | "ph4";

export type Fuente = { src: string } | { placeholder: Placeholder };

/** Fondo de una imagen o placeholder. `src` debe venir ya desenfocada desde el servidor. */
export function fondo(fuente: Fuente): CSSProperties {
  return "src" in fuente
    ? { backgroundImage: `url("${fuente.src}")`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `var(--${fuente.placeholder})` };
}

type VeloProps = {
  fuente: Fuente;
  /** mini: miniaturas (blur 12px, solo candado). grande: vistas de detalle (blur 34px, candado en círculo + precio). */
  tamano?: "mini" | "grande";
  /** Texto de la píldora: "12 fotos · $149". Solo en grande. */
  precio?: string;
  /** Duración si es video: "0:42". Cambia el candado por play. */
  duracion?: string;
  className?: string;
  children?: ReactNode;
};

const capaOscura = "bg-black/28";

/**
 * Vista con velo. El cliente nunca recibe la imagen nítida antes de pagar:
 * el blur de CSS es solo un refuerzo sobre una imagen ya desenfocada en servidor.
 */
export function Velo({ fuente, tamano = "mini", precio, duracion, className, children }: VeloProps) {
  const grande = tamano === "grande";
  const esVideo = duracion !== undefined;
  return (
    <div className={cn("relative isolate overflow-hidden", grande ? "rounded-[26px]" : "rounded-[14px]", className)}>
      <div
        aria-hidden
        className={cn("absolute", grande ? "-inset-[50px] blur-[34px]" : "-inset-4 blur-[12px]")}
        style={fondo(fuente)}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-white">
        {grande ? (
          <>
            <span className={cn("grid size-14 place-items-center rounded-full", capaOscura)}>
              {esVideo ? (
                <PlayIcon weight="fill" size={24} aria-label="Video" />
              ) : (
                <LockIcon weight="bold" size={22} aria-label="Bloqueado" />
              )}
            </span>
            {(precio || duracion) && (
              <span className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold", capaOscura)}>
                {[duracion, precio].filter(Boolean).join(" · ")}
              </span>
            )}
          </>
        ) : esVideo ? (
          <PlayIcon weight="fill" size={18} aria-label="Video" />
        ) : (
          <LockIcon weight="bold" size={18} aria-label="Bloqueado" />
        )}
      </div>
      {!grande && esVideo && (
        <span
          className={cn(
            "absolute right-1.5 bottom-1.5 whitespace-nowrap rounded-full px-1.5 py-px text-[11px] font-bold text-white",
            capaOscura,
          )}
        >
          {duracion}
        </span>
      )}
      {children}
    </div>
  );
}

/** Miniatura sin velo (contenido gratis o ya comprado). */
export function Miniatura({ fuente, className }: { fuente: Fuente; className?: string }) {
  return <div className={cn("rounded-[14px]", className)} style={fondo(fuente)} />;
}

import { cn } from "@/lib/cn";

export type Tono = "ok" | "warn" | "bad" | "neutro";

/** Estados de un set en la bóveda. */
export type EstadoItem = "publicado" | "moderacion" | "rechazado" | "borrador";

export const ESTADOS_ITEM: Record<EstadoItem, { tono: Tono; label: string }> = {
  publicado: { tono: "ok", label: "Publicado" },
  moderacion: { tono: "warn", label: "En moderación" },
  rechazado: { tono: "bad", label: "Rechazado" },
  borrador: { tono: "neutro", label: "Borrador" },
};

const colorTexto: Record<Tono, string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  neutro: "text-muted",
};

const colorPildora: Record<Tono, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  neutro: "bg-surface text-muted",
};

/** Estado = punto de 8px + texto. Va junto o debajo del título, nunca encima. */
export function Estado({
  tono,
  children,
  className,
}: {
  tono: Tono;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-sm font-bold", colorTexto[tono], className)}>
      <span aria-hidden className="size-2 flex-none rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Píldora rellena: solo encima de miniaturas. */
export function PildoraEstado({
  tono,
  children,
  className,
}: {
  tono: Tono;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-bold",
        colorPildora[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EstadoDeItem({ estado, className }: { estado: EstadoItem; className?: string }) {
  const { tono, label } = ESTADOS_ITEM[estado];
  return (
    <Estado tono={tono} className={className}>
      {label}
    </Estado>
  );
}

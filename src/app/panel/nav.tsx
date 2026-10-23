"use client";

import { BankIcon, ChartBarIcon, FlagIcon, IdentificationCardIcon, TrayIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const SECCIONES = [
  { href: "/panel/moderacion", label: "Moderación", icono: TrayIcon, conteo: "moderacion" },
  { href: "/panel/verificaciones", label: "Verificaciones", icono: IdentificationCardIcon, conteo: "verificaciones" },
  { href: "/panel/pagos", label: "Pagos", icono: BankIcon, conteo: "pagos" },
  { href: "/panel/metricas", label: "Métricas", icono: ChartBarIcon, conteo: null },
  { href: "/panel/reportes", label: "Reportes", icono: FlagIcon, conteo: "reportes" },
] as const;

type Conteo = NonNullable<(typeof SECCIONES)[number]["conteo"]>;

export function NavPanel({ conteos }: { conteos: Record<Conteo, number> }) {
  const ruta = usePathname();
  return SECCIONES.map(({ href, label, icono: Icono, conteo }) => {
    const activa = ruta.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={activa ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-2.5 rounded-full px-3 text-sm text-text! no-underline",
          activa ? "bg-surface-2 font-bold" : "font-medium hover:bg-surface-2",
        )}
      >
        <Icono weight="bold" size={18} />
        <span className="flex-1">{label}</span>
        {conteo && conteos[conteo] > 0 && <span className="text-xs text-muted">{conteos[conteo]}</span>}
      </Link>
    );
  });
}

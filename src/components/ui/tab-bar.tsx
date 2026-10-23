import type { Icon } from "@phosphor-icons/react";
import { ChartBarIcon, ChatCircleIcon, PlusIcon, SquaresFourIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/cn";

const barra = "grid border-t border-line bg-surface px-1.5 pt-2 pb-[22px] text-center text-[11px]";

function Pestana({
  href,
  activa,
  icono: Icono,
  aviso,
  children,
}: {
  href: string;
  activa: boolean;
  icono?: Icon;
  /** Punto de "hay algo nuevo" (mensajes sin leer). */
  aviso?: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 flex-col items-center justify-center gap-[3px] no-underline",
        activa ? "font-bold text-accent-ink! hover:text-accent-ink!" : "font-medium text-muted! hover:text-text!",
      )}
    >
      {Icono && <Icono weight="bold" size={22} />}
      {children}
      {aviso && <span aria-label="Sin leer" className="absolute top-0.5 left-[calc(50%+8px)] size-2 rounded-full bg-accent" />}
    </Link>
  );
}

export type PestanaCreadora = "boveda" | "ventas" | "mensajes" | "perfil";

/** Bóveda · Ventas · [+] · Mensajes · Perfil. El + es sólido ciruela, sin degradado. Retiros vive dentro de Ventas. */
export function BarraCreadora({ activa, base = "/app", sinLeer }: { activa: PestanaCreadora; base?: string; sinLeer?: boolean }) {
  return (
    <nav aria-label="Principal" className={cn(barra, "grid-cols-5")}>
      <Pestana href={`${base}/boveda`} activa={activa === "boveda"} icono={SquaresFourIcon}>
        Bóveda
      </Pestana>
      <Pestana href={`${base}/ventas`} activa={activa === "ventas"} icono={ChartBarIcon}>
        Ventas
      </Pestana>
      <div className="grid place-items-center">
        <Link
          href={`${base}/subir`}
          aria-label="Subir un set"
          className="grid size-11 place-items-center rounded-full bg-text text-bg! hover:text-bg!"
        >
          <PlusIcon weight="bold" size={24} />
        </Link>
      </div>
      <Pestana href={`${base}/mensajes`} activa={activa === "mensajes"} icono={ChatCircleIcon} aviso={sinLeer}>
        Mensajes
      </Pestana>
      <Pestana href={`${base}/perfil`} activa={activa === "perfil"} icono={UserIcon}>
        Perfil
      </Pestana>
    </nav>
  );
}

export type PestanaFan = "inicio" | "explorar" | "mensajes" | "compras";

/** Inicio · Explorar · Mensajes · Mis compras (lado social). */
export function BarraFan({ activa, sinLeer }: { activa: PestanaFan; sinLeer?: boolean }) {
  return (
    <nav aria-label="Principal" className={cn(barra, "grid-cols-4 pt-2.5")}>
      <Pestana href="/inicio" activa={activa === "inicio"}>
        Inicio
      </Pestana>
      <Pestana href="/explorar" activa={activa === "explorar"}>
        Explorar
      </Pestana>
      <Pestana href="/mensajes" activa={activa === "mensajes"} aviso={sinLeer}>
        Mensajes
      </Pestana>
      <Pestana href="/mis-compras" activa={activa === "compras"}>
        Mis compras
      </Pestana>
    </nav>
  );
}

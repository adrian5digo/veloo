"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChartBarIcon, ChatCircleIcon, PlusIcon, SquaresFourIcon, UserIcon, ArrowUpRightIcon, LockIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/ui";

const destinos = [
  { href: "/app/boveda", titulo: "Bóveda", icono: SquaresFourIcon },
  { href: "/app/ventas", titulo: "Ventas", icono: ChartBarIcon },
  { href: "/app/mensajes", titulo: "Mensajes", icono: ChatCircleIcon },
  { href: "/app/perfil", titulo: "Perfil", icono: UserIcon },
];

export function EspacioCreadora({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  return (
    <div className="espacio-creadora">
      <a className="salto-contenido" href="#contenido-creadora">Ir al contenido</a>
      <aside className="lateral-creadora">
        <Link href="/" className="marca-creadora" aria-label="Veloo, inicio"><Logo tamano={34} /></Link>
        <p className="etiqueta-creadora">Tu espacio de creadora</p>
        <nav aria-label="Navegación de creadora">
          {destinos.map(({ href, titulo, icono: Icono }) => {
            const activa = ruta.startsWith(href) || (href === "/app/ventas" && ruta.startsWith("/app/retiros")) || (href === "/app/boveda" && ruta.startsWith("/app/sets"));
            return <Link key={href} href={href} aria-current={activa ? "page" : undefined}><Icono size={22} weight="bold" />{titulo}</Link>;
          })}
          <Link href="/app/subir" className="nuevo-creadora" aria-current={ruta === "/app/subir" ? "page" : undefined}><PlusIcon size={22} weight="bold" />Nuevo set</Link>
        </nav>
        <div className="nota-creadora"><LockIcon size={26} weight="bold" /><p>Lo que creas,<br /><strong>queda en tus manos.</strong></p><span>Tus originales son privados. Tú eliges qué compartir.</span></div>
        <Link href="/inicio" className="explorar-creadora">Ver como fan <ArrowUpRightIcon size={18} weight="bold" /></Link>
      </aside>
      <div className="contenido-creadora" id="contenido-creadora" tabIndex={-1}>
        <div className="marca-movil-creadora"><Link href="/" aria-label="Veloo, inicio"><Logo tamano={26} /></Link><span>Tu espacio de creadora</span></div>
        {children}
      </div>
    </div>
  );
}

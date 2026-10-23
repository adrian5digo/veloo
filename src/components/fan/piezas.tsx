import { DotsThreeIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { FilaLista, Velo } from "@/components/ui";
import { precio } from "@/lib/dinero";
import { linkVisible, rutaPublica } from "@/lib/links";
import { urlVelo } from "@/lib/medios";
import { cuantasFotos } from "@/lib/texto";
import type { SetPublico } from "@/server/publico";

/** Barra de arriba de las páginas del fan: el link en mono, como lo ve en el navegador de Instagram. */
export function BarraLink({
  usuario,
  slug,
  izquierda,
  menu,
  borde = true,
}: {
  usuario: string;
  slug?: string;
  izquierda?: ReactNode;
  /** Link del menú de tres puntos (reportar). */
  menu?: string;
  borde?: boolean;
}) {
  return (
    <header className={`flex min-h-12 items-center gap-2.5 px-[18px] py-1 text-[13px] text-muted ${borde ? "border-b border-line" : ""}`}>
      <span className="w-11">{izquierda}</span>
      <span className="flex-1 truncate text-center font-mono text-xs">{linkVisible(usuario, slug)}</span>
      <span className="grid w-11 justify-end">
        {menu && (
          <Link href={menu} aria-label="Reportar" className="grid size-11 place-items-center text-muted!">
            <DotsThreeIcon weight="bold" size={20} />
          </Link>
        )}
      </span>
    </header>
  );
}

/** Fila de un set publicado: miniatura con velo + título + precio. */
export function FilaSet({ usuario, set, nuevo }: { usuario: string; set: SetPublico; nuevo?: boolean }) {
  return (
    <FilaLista
      href={rutaPublica(usuario, set.slug)}
      miniatura={
        set.portadaId ? (
          <Velo fuente={{ src: urlVelo(set.portadaId, "mini") }} className="size-16 rounded-[12px]" />
        ) : (
          <div className="size-16 rounded-[12px] bg-surface-2" />
        )
      }
      titulo={set.titulo}
      meta={[cuantasFotos(set.fotos), nuevo && "nuevo"].filter(Boolean).join(" · ")}
      derecha={set.precio > 0 ? precio(set.precio) : "Gratis"}
    />
  );
}

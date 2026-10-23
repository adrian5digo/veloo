import { ArrowUpRightIcon, DotsThreeIcon, ImagesIcon, LockIcon } from "@phosphor-icons/react/dist/ssr";
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

/** Portadas públicas: únicamente derivados con velo generado en servidor. */
export function TarjetaSet({ usuario, set, destacada = false, nuevo = false }: { usuario: string; set: SetPublico; destacada?: boolean; nuevo?: boolean }) {
  return (
    <Link href={rutaPublica(usuario, set.slug)} className="group relative block min-w-0 rounded-[26px] border border-line bg-surface p-2 text-text! no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink">
      {destacada && <span className="absolute -top-3 right-4 z-10 rotate-3 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-ink">{nuevo ? "Recién subido" : "Último set"}</span>}
      <div className="relative">
        <Velo fuente={set.portadaId ? { src: urlVelo(set.portadaId, destacada ? "grande" : "mini") } : { placeholder: "ph" }} tamano={destacada ? "grande" : "mini"} precio={destacada ? (set.precio > 0 ? precio(set.precio) : "Gratis") : undefined} className={destacada ? "aspect-[3/2] w-full rounded-[22px]" : "aspect-[4/5] w-full rounded-[18px]"} />
        {!destacada && <span className="absolute right-2 bottom-2 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-text">{set.precio > 0 ? precio(set.precio) : "Gratis"}</span>}
      </div>
      <div className={destacada ? "flex items-center justify-between gap-3 px-2 py-3" : "px-1.5 pt-2.5 pb-1.5"}>
        <div className="min-w-0"><h3 className={`m-0 break-words font-display font-semibold ${destacada ? "text-[24px] leading-tight" : "text-lg leading-tight"}`}>{set.titulo}</h3><p className="m-0 mt-1 flex items-center gap-1.5 text-xs text-muted"><ImagesIcon size={15} weight="bold" aria-hidden />{cuantasFotos(set.fotos)}{!destacada && nuevo && <span className="ml-auto text-accent-ink">Nuevo</span>}</p></div>
        {destacada && <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink"><ArrowUpRightIcon size={22} weight="bold" aria-hidden /></span>}
      </div>
      {destacada && <span className="sr-only"><LockIcon aria-hidden /> Ver detalle del set</span>}
    </Link>
  );
}

"use client";

import { ImagesIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import {
  BarraCreadora,
  Boton,
  Chips,
  ESTADOS_ITEM,
  Estado,
  VeloRevelable,
  ZonaCTA,
  type Tono,
} from "@/components/ui";
import { precio } from "@/lib/dinero";
import { urlsDeMedio } from "@/lib/medios";
import { CabeceraCreadora } from "@/components/creadora/cabecera";

/** "oculto": lo quitó un reporte urgente o una firma retirada. "retirado" no llega aquí. */
type EstadoBoveda = keyof typeof ESTADOS_ITEM | "oculto";

export type ItemBoveda = {
  id: string;
  titulo: string;
  precio: number;
  estado: EstadoBoveda;
  portadaId: string | null;
  ventas: number;
};

const ESTADOS: Record<EstadoBoveda, { tono: Tono; label: string }> = {
  ...ESTADOS_ITEM,
  oculto: { tono: "bad", label: "Oculto" },
};

type Filtro = "todo" | "borrador" | "moderacion" | "publicado" | "rechazado";

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: "todo", label: "Todo" },
  { valor: "borrador", label: "Borradores" },
  { valor: "moderacion", label: "En moderación" },
  { valor: "publicado", label: "Publicados" },
  { valor: "rechazado", label: "Rechazados" },
];

/** C3 · Bóveda. Las miniaturas llevan velo también para la creadora; nítidas solo al mantener presionado. */
export function Boveda({ items, sinLeer }: { items: ItemBoveda[]; sinLeer?: boolean }) {
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const visibles = filtro === "todo" ? items : items.filter((i) => i.estado === filtro);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <CabeceraCreadora titulo="Tu bóveda" detalle="Tus fotos, tus ideas y lo próximo que vas a compartir." />
      {items.length > 0 && <div className="resumen-boveda"><span><strong>{items.length}</strong>Sets en tu bóveda</span><span><strong>{items.filter((i) => i.estado === "publicado").length}</strong>Publicados</span><span><strong>{items.reduce((total, i) => total + i.ventas, 0)}</strong>Ventas de sets</span></div>}

      <div className="flex flex-1 flex-col">
        {items.length === 0 ? (
          <Vacia />
        ) : (
          <>
            <div className="overflow-x-auto px-5 pt-3.5 [scrollbar-width:none]">
              <Chips label="Filtrar sets" opciones={FILTROS} valor={filtro} onChange={setFiltro} className="w-max" />
            </div>
            {visibles.length === 0 ? (
              <p className="m-0 px-5 pt-8 text-[15px] text-muted">
                Nada por aquí. Prueba con otro filtro o en <b className="font-semibold text-text">Todo</b>.
              </p>
            ) : (
              <ul className="m-0 grid list-none grid-cols-2 content-start gap-2.5 px-4 pt-3.5 pb-6">
                {visibles.map((it) => (
                  <Tarjeta key={it.id} item={it} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="sticky bottom-0">
        <BarraCreadora activa="boveda" sinLeer={sinLeer} />
      </div>
    </main>
  );
}

function Tarjeta({ item }: { item: ItemBoveda }) {
  const { tono, label } = ESTADOS[item.estado];
  const destino =
    item.estado === "borrador" || item.estado === "rechazado"
      ? `/app/sets/${item.id}/consentimiento`
      : item.estado === "publicado"
        ? `/app/sets/${item.id}`
        : null;
  const urls = item.portadaId ? urlsDeMedio(item.portadaId) : null;
  const texto = (
    <>
      <span className="block truncate text-sm font-semibold">{item.titulo}</span>
      <Estado tono={tono} className="mt-1 text-xs">{label}</Estado>
      <span className="mt-0.5 flex justify-between text-xs text-muted">
        <span>{item.precio > 0 ? precio(item.precio) : "Gratis"}</span>
        <span>{item.ventas === 0 ? "Sin ventas" : item.ventas === 1 ? "1 venta" : `${item.ventas} ventas`}</span>
      </span>
    </>
  );

  return (
    <li className="overflow-hidden rounded-[22px] border border-line bg-surface p-1.5">
      {urls ? (
        <VeloRevelable fuente={{ src: urls.velo.mini }} nitida={{ src: urls.vista }} className="h-[160px] sm:h-[200px]" />
      ) : (
        <div className="grid h-[160px] place-items-center rounded-[14px] bg-surface-2 text-muted sm:h-[200px]"><ImagesIcon size={32} weight="bold" aria-label="Sin portada" /></div>
      )}
      {destino ? (
        <Link href={destino} className="block px-1.5 pt-2 pb-1.5 text-text! no-underline">
          {texto}
        </Link>
      ) : (
        <div className="px-1.5 pt-2 pb-1.5">{texto}</div>
      )}
    </li>
  );
}

/** E1 · Bóveda vacía. */
function Vacia() {
  return (
    <>
      <div className="vacio-creadora">
        <div className="dibujo-boveda" aria-hidden="true"><span /><span><ImagesIcon size={40} weight="bold" /></span><small>Algo muy tuyo</small></div>
        <h2>Tu primer set empieza aquí</h2>
        <p>Elige las fotos de una sesión, ponle un nombre y decide su precio. Puedes preparar tu borrador con calma antes de enviarlo a revisión.</p>
      </div>
      <ZonaCTA>
        <Boton href="/app/subir">Subir mi primer set</Boton>
      </ZonaCTA>
    </>
  );
}

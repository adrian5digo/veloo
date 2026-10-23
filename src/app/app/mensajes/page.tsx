import { CaretRightIcon, PlusIcon, ChatCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { CabeceraCreadora } from "@/components/creadora/cabecera";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Avatar, BarraCreadora, Boton, FilaLista } from "@/components/ui";
import { iniciales } from "@/lib/texto";
import { hace } from "@/lib/tiempo";
import { vistaPrevia } from "@/server/mensajes";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";

export const metadata: Metadata = { title: "Mensajes · Veloo" };

/** C12 · Mensajes de la creadora: fans que le escribieron o a quienes les mandó un set. */
export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/mensajes");
  const supabase = await supabaseServidor();
  const [{ data, error }, { data: c }] = await Promise.all([
    supabase.from("bandeja_creadora").select("*").order("ultimo_en", { ascending: false }),
    supabase.from("creadoras").select("usuario, mensajes_abiertos").eq("id", creadora.id).single(),
  ]);
  if (error) throw error;
  if (!c?.usuario) redirect("/app/registro");
  const sinLeer = data.some((x) => x.sin_leer);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <CabeceraCreadora titulo="Tus mensajes" detalle="Un espacio para conversar con quienes siguen lo que haces." accion={
        <Boton variante="texto" href="/app/mensajes/enviar" icono={<PlusIcon weight="bold" size={18} />} className="-mr-3">
          Mandar un set
        </Boton>
      } />
      {!c.mensajes_abiertos && (
        <p className="m-0 px-5 pt-1 text-[13px] text-muted">
          Tienes los mensajes cerrados: nadie te puede escribir primero. Ábrelos en Perfil.
        </p>
      )}

      <section className="flex flex-col gap-2.5 px-5 pt-4 pb-6">
        {data.length === 0 && (
          <div className="vacio-creadora">
            <span className="icono-vacio-creadora" aria-hidden="true"><ChatCircleIcon size={34} weight="bold" /></span>
            <h2>Las conversaciones empiezan con un set</h2>
            <p>
              Te pueden escribir quienes ya te compraron o están suscritos. Tú puedes mandarles un set nuevo a todos con un toque: les llega con velo y su precio.
            </p>
          </div>
        )}
        {data.map((x) => {
          const nombre = x.fan_nombre ?? "Fan";
          const meta = [x.suscrito ? "suscripción" : null, x.compras ? (x.compras === 1 ? "1 compra" : `${x.compras} compras`) : null, x.bloqueado ? "bloqueado" : null]
            .filter(Boolean)
            .join(" · ");
          return (
            <FilaLista
              key={x.id}
              href={`/app/mensajes/${x.id}`}
              miniatura={<Avatar iniciales={iniciales(nombre)} tamano={64} />}
              titulo={
                <span className="flex items-center gap-2">
                  <span className="truncate">{nombre}</span>
                  {x.sin_leer && <span aria-label="Sin leer" className="size-2 flex-none rounded-full bg-accent" />}
                </span>
              }
              meta={
                <>
                  <span className={`block truncate ${x.sin_leer ? "font-semibold text-text" : ""}`}>{vistaPrevia(x, "creadora")}</span>
                  <span className="block text-xs">
                    {meta && `${meta} · `}
                    {hace(x.ultimo_en)}
                  </span>
                </>
              }
              derecha={<CaretRightIcon weight="bold" size={18} className="mr-1.5 text-muted" />}
            />
          );
        })}
      </section>

      <div className="sticky bottom-0 mt-auto">
        <BarraCreadora activa="mensajes" sinLeer={sinLeer} />
      </div>
    </main>
  );
}

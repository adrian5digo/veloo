import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Avatar, BarraFan, FilaLista } from "@/components/ui";
import { urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { hace } from "@/lib/tiempo";
import { fanActual } from "@/server/fan";
import { vistaPrevia } from "@/server/mensajes";
import { supabaseServidor } from "@/server/supabase";

export const metadata: Metadata = { title: "Mensajes · Veloo", robots: { index: false } };

/** F8 · Mensajes del fan: sus conversaciones con creadoras, la más reciente arriba. */
export default async function Page() {
  const fan = await fanActual();
  if (!fan) redirect("/entrar?siguiente=/mensajes");
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("bandeja_fan").select("*").order("ultimo_en", { ascending: false });
  if (error) throw error;
  const sinLeer = data.some((c) => c.sin_leer);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <h1 className="m-0 px-5 pt-5 font-display text-[26px] font-semibold tracking-[-0.01em]">Mensajes</h1>

      <section className="flex flex-col gap-2.5 px-5 pt-4">
        {data.length === 0 && (
          <p className="m-0 pt-4 text-[15px] leading-normal text-pretty text-muted">
            Aquí ves lo que te manden las creadoras a las que les compras o estás suscrito. Para escribirle a una, entra a su página y toca “Mandarle un mensaje”.
          </p>
        )}
        {data.map((c) => {
          const nombre = c.creadora_nombre ?? "";
          return (
            <FilaLista
              key={c.id}
              href={`/mensajes/${c.id}`}
              miniatura={<Avatar iniciales={iniciales(nombre)} src={urlAvatar(c.creadora_avatar)} tamano={64} />}
              titulo={
                <span className="flex items-center gap-2">
                  <span className="truncate">{nombre}</span>
                  {c.sin_leer && <span aria-label="Sin leer" className="size-2 flex-none rounded-full bg-accent" />}
                </span>
              }
              meta={
                <span className="flex gap-2">
                  <span className={`min-w-0 flex-1 truncate ${c.sin_leer ? "font-semibold text-text" : ""}`}>{vistaPrevia(c, "fan")}</span>
                  <span className="flex-none">{hace(c.ultimo_en).replace("hace ", "")}</span>
                </span>
              }
              derecha={<CaretRightIcon weight="bold" size={18} className="mr-1.5 text-muted" />}
            />
          );
        })}
      </section>

      <div className="sticky bottom-0 mt-auto">
        <BarraFan activa="mensajes" sinLeer={sinLeer} />
      </div>
    </main>
  );
}

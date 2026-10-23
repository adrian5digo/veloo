import { CaretRightIcon, CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, BarraFan, FilaLista, Miniatura, Velo } from "@/components/ui";
import { rutaPublica } from "@/lib/links";
import { urlAvatar, urlVelo } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fecha, isoHaceDias } from "@/lib/tiempo";
import { fanActual, portadasNitidas } from "@/server/fan";
import { haySinLeer } from "@/server/mensajes";
import { supabaseServidor } from "@/server/supabase";

export const metadata: Metadata = { title: "Mis compras · Veloo" };

/** S4 · Mis compras: pagadas y pendientes (OXXO/SPEI con borde punteado). */
export default async function Page() {
  const fan = await fanActual();
  if (!fan) redirect("/entrar?siguiente=/mis-compras");
  const supabase = await supabaseServidor();
  const [{ data, error }, { data: saldo }, { data: subs }] = await Promise.all([
    supabase.from("mis_compras").select("*").order("creada_en", { ascending: false }),
    supabase.from("mi_saldo_tokens").select("tokens").maybeSingle(),
    // Activas y las que terminaron hace menos de un mes (para saber por qué).
    supabase.from("mis_suscripciones").select("*").gt("periodo_hasta", isoHaceDias(30)).order("periodo_hasta", { ascending: false }),
  ]);
  if (error) throw error;
  const pagadas = data.filter((c) => c.estado === "pagada").length;
  const nitidas = await portadasNitidas(data.filter((c) => c.estado === "pagada").map((c) => c.portada_id));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <h1 className="m-0 px-5 pt-5 font-display text-[26px] font-semibold tracking-[-0.01em]">Mis compras</h1>
      <p className="m-0 px-5 pt-1.5 text-[13px] text-muted">
        {pagadas === 1 ? "1 compra" : `${pagadas} compras`} · <span className="font-mono">{fan.correo}</span>
      </p>
      <Link
        href="/tokens"
        className="mx-5 mt-4 flex min-h-12 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text! no-underline"
      >
        <CoinsIcon weight="bold" size={18} className="-rotate-12 text-accent-ink" />
        <span className="flex-1">Tus tokens</span>
        <span>{new Intl.NumberFormat("es-MX").format(saldo?.tokens ?? 0)}</span>
        <CaretRightIcon weight="bold" size={16} className="text-muted" />
      </Link>

      {(subs ?? []).length > 0 && (
        <section className="flex flex-col gap-2.5 px-5 pt-5">
          <h2 className="m-0 text-[13px] font-semibold">Suscripciones</h2>
          {subs!.map((x) => {
            const nombre = x.creadora_nombre || x.creadora_usuario || "";
            const meta = x.activa
              ? x.renovar
                ? `Se renueva el ${fecha(x.periodo_hasta!)} · ${x.tokens} tokens`
                : `Termina el ${fecha(x.periodo_hasta!)} · no se renueva`
              : x.fin_motivo === "sin_saldo"
                ? "Se detuvo: no alcanzaron tus tokens"
                : `Terminó el ${fecha(x.periodo_hasta!)}`;
            return (
              <FilaLista
                key={x.id}
                href={x.creadora_usuario ? `${rutaPublica(x.creadora_usuario)}/suscripcion` : undefined}
                miniatura={<Avatar iniciales={iniciales(nombre)} src={urlAvatar(x.creadora_avatar)} tamano={64} />}
                titulo={nombre}
                meta={meta}
                derecha={<CaretRightIcon weight="bold" size={18} className="mr-1.5 text-muted" />}
              />
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-2.5 px-5 pt-4">
        {(subs ?? []).length > 0 && data.length > 0 && <h2 className="m-0 pt-1 text-[13px] font-semibold">Sets</h2>}
        {data.length === 0 && (
          <p className="m-0 pt-4 text-[15px] leading-normal text-muted">
            Aquí aparece lo que compres con este correo. Si compraste con otro, entra con ese correo para verlo.
          </p>
        )}
        {data.map((c) => {
          const pendiente = c.estado === "pendiente";
          const vencida = c.estado === "vencida";
          const meta = pendiente
            ? `Esperando pago${c.vence_en ? ` · vence ${fecha(c.vence_en)}` : ""}`
            : vencida
              ? "La ficha venció · no se cobró nada"
              : c.creadora_nombre || c.creadora_usuario || "";
          return (
            <FilaLista
              key={c.id}
              href={c.estado === "pagada" ? `/mis-compras/${c.id}` : undefined}
              pendiente={pendiente || vencida}
              miniatura={
                pendiente || vencida ? (
                  <div className="grid size-16 place-items-center rounded-[12px] bg-surface-2 text-xs font-semibold text-muted">
                    {c.metodo === "oxxo" ? "OXXO" : "SPEI"}
                  </div>
                ) : c.portada_id && nitidas.get(c.portada_id) ? (
                  <Miniatura fuente={{ src: nitidas.get(c.portada_id)! }} className="size-16 rounded-[12px]" />
                ) : c.portada_id ? (
                  <Velo fuente={{ src: urlVelo(c.portada_id, "mini") }} className="size-16 rounded-[12px]" />
                ) : (
                  <Miniatura fuente={{ placeholder: "ph" }} className="size-16 rounded-[12px]" />
                )
              }
              titulo={c.titulo}
              meta={meta}
              derecha={c.estado === "pagada" ? <CaretRightIcon weight="bold" size={18} className="mr-1.5 text-muted" /> : undefined}
            />
          );
        })}
      </section>

      <div className="sticky bottom-0 mt-auto">
        <BarraFan activa="compras" sinLeer={await haySinLeer("fan")} />
      </div>
    </main>
  );
}


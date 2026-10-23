"use client";

import { ArrowUpIcon, PlusIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { FilaLista, Velo } from "@/components/ui";
import { cn } from "@/lib/cn";
import { precio } from "@/lib/dinero";
import { urlVelo } from "@/lib/medios";
import { horaCorta } from "@/lib/tiempo";
import type { Mensaje } from "@/server/mensajes";

export type Adjuntable = { id: string; titulo: string; precio: number; portadaId: string | null };
type Envio = (texto: string, setId: string | null) => Promise<{ ok: true } | { ok: false; error: string }>;

const MAX = 1000;

/** Conversación (C13 y F8): globos, sets adjuntos con velo y la caja para escribir. */
export function Hilo({
  mensajes,
  yo,
  enviar,
  bloqueo,
  adjuntables,
}: {
  mensajes: Mensaje[];
  yo: "fan" | "creadora";
  enviar: Envio;
  /** Si no puede escribir, por qué (en lugar de la caja). */
  bloqueo?: string;
  /** Solo la creadora: sus sets publicados para adjuntar. */
  adjuntables?: Adjuntable[];
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [adjunto, setAdjunto] = useState<Adjuntable | null>(null);
  const [hoja, setHoja] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  const final = useRef<HTMLDivElement>(null);

  useEffect(() => final.current?.scrollIntoView({ block: "end" }), [mensajes.length]);

  function mandar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() && !adjunto) return;
    setError(undefined);
    iniciar(async () => {
      const r = await enviar(texto, adjunto?.id ?? null);
      if (!r.ok) return setError(r.error);
      setTexto("");
      setAdjunto(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-2 px-4 pt-2 pb-4">
        {mensajes.length === 0 && (
          <p className="m-0 px-2 pt-8 text-center text-sm leading-normal text-pretty text-muted">
            {yo === "fan" ? "Escríbele algo. Ve tu mensaje en cuanto entre a Veloo." : "Todavía no hay mensajes."}
          </p>
        )}
        {mensajes.map((m) => {
          const mio = m.autor === yo;
          return (
            <div key={m.id} className={cn("flex flex-col gap-1", mio ? "items-end" : "items-start")}>
              {m.set && (
                <FilaLista
                  href={m.set.href}
                  className="w-[86%]"
                  miniatura={
                    m.set.portadaId ? (
                      <Velo fuente={{ src: urlVelo(m.set.portadaId, "mini") }} className="size-16 rounded-[12px]" />
                    ) : (
                      <div className="size-16 rounded-[12px] bg-surface-2" />
                    )
                  }
                  titulo={m.set.titulo}
                  meta={yo === "creadora" ? "Lo mandaste con velo" : m.set.abierto ? "Ya lo puedes ver" : "Toca para desbloquearlo"}
                  derecha={m.set.precio > 0 ? precio(m.set.precio) : "Gratis"}
                />
              )}
              {m.texto && (
                <p
                  className={cn(
                    "m-0 max-w-[80%] rounded-[22px] px-4 py-2.5 text-[15px] leading-[1.4] break-words whitespace-pre-wrap",
                    mio ? "rounded-br-[8px] bg-text text-bg" : "rounded-bl-[8px] border border-line bg-surface",
                  )}
                >
                  {m.texto}
                </p>
              )}
              <span className="px-2 text-xs text-muted">{horaCorta(m.creadoEn)}</span>
            </div>
          );
        })}
        <div ref={final} />
      </div>

      <div className="sticky bottom-0 border-t border-line bg-bg px-4 pt-2.5 pb-5">
        {bloqueo ? (
          <p className="m-0 py-2 text-center text-sm text-pretty text-muted">{bloqueo}</p>
        ) : (
          <form onSubmit={mandar} className="flex flex-col gap-2">
            {error && <p className="m-0 px-2 text-[13px] font-semibold text-bad">{error}</p>}
            {adjunto && (
              <div className="flex min-h-9 items-center gap-2 self-start rounded-full bg-accent-soft py-1 pr-1 pl-3.5 text-[13px] font-semibold text-accent-ink">
                Set: {adjunto.titulo}
                <button type="button" aria-label="Quitar set" onClick={() => setAdjunto(null)} className="grid size-7 cursor-pointer place-items-center rounded-full">
                  <XIcon weight="bold" size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {adjuntables && (
                <button
                  type="button"
                  aria-label="Adjuntar un set"
                  onClick={() => setHoja(true)}
                  className="grid size-11 flex-none cursor-pointer place-items-center rounded-full border border-line bg-surface text-text"
                >
                  <PlusIcon weight="bold" size={20} />
                </button>
              )}
              <label className="sr-only" htmlFor="mensaje">
                Mensaje
              </label>
              <input
                id="mensaje"
                value={texto}
                maxLength={MAX}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={yo === "fan" ? "Escribe un mensaje" : "Contesta o manda un set"}
                autoComplete="off"
                className="min-h-[50px] w-full min-w-0 rounded-full border border-line bg-surface px-5 text-base font-medium text-text outline-none placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              />
              <button
                type="submit"
                aria-label="Enviar"
                disabled={ocupado || (!texto.trim() && !adjunto)}
                className="grid size-11 flex-none cursor-pointer place-items-center rounded-full bg-text text-bg disabled:opacity-40"
              >
                <ArrowUpIcon weight="bold" size={20} />
              </button>
            </div>
          </form>
        )}
      </div>

      {hoja && adjuntables && (
        <div role="dialog" aria-modal aria-label="Adjuntar un set" className="fixed inset-0 z-20 flex items-end justify-center bg-black/30" onClick={() => setHoja(false)}>
          <div
            className="flex max-h-[70dvh] w-full max-w-[480px] flex-col gap-2.5 overflow-y-auto rounded-t-[26px] bg-bg px-5 pt-5 pb-7 shadow-[var(--shadow)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 font-display text-xl font-semibold">Manda un set</h2>
            <p className="m-0 text-[13px] text-muted">Le llega con velo y su precio. Si ya lo tiene o está suscrito, lo ve completo.</p>
            {adjuntables.length === 0 && <p className="m-0 py-3 text-sm text-muted">Todavía no tienes sets publicados.</p>}
            {adjuntables.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setAdjunto(s);
                  setHoja(false);
                }}
                className="cursor-pointer border-0 bg-transparent p-0 text-left"
              >
                <FilaLista
                  miniatura={
                    s.portadaId ? (
                      <Velo fuente={{ src: urlVelo(s.portadaId, "mini") }} className="size-16 rounded-[12px]" />
                    ) : (
                      <div className="size-16 rounded-[12px] bg-surface-2" />
                    )
                  }
                  titulo={s.titulo}
                  derecha={s.precio > 0 ? precio(s.precio) : "Gratis"}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

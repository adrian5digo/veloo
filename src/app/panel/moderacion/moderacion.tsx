"use client";

import { CheckIcon, ClockIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Avatar, Boton, Chips, Estado, Velo } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Database } from "@/lib/database.types";
import { precioMXN } from "@/lib/dinero";
import { cuantasFotos, iniciales } from "@/lib/texto";
import { hace } from "@/lib/tiempo";
import { decidir } from "./acciones";

export type ItemCola = {
  id: string;
  titulo: string;
  creadora: string;
  fotos: number;
  video: boolean;
  conOtras: boolean;
  enviadoEn: string | null;
  portada: string | null;
};

type EstadoFirma = Database["public"]["Enums"]["estado_firma"];

export type DetalleSet = {
  id: string;
  titulo: string;
  precio: number;
  creadora: string;
  verificada: boolean;
  edad: number | null;
  historial: string;
  /** Links firmados a la versión nítida (10 min). */
  fotos: string[];
  conOtras: boolean;
  personas: { id: string; telefono: string; estado: EstadoFirma }[];
};

type Motivo = { codigo: string; texto_para_creadora: string };

/** Nombre corto del motivo en el panel; la creadora lee texto_para_creadora. */
const NOMBRE_MOTIVO: Record<string, string> = {
  tercero_sin_firma: "Tercero sin firma",
  posible_menor: "Menor de edad posible",
  contenido_sexual: "Desnudos o sexual",
  datos_personales: "Datos personales",
  calidad: "Calidad",
  contenido_prohibido: "Contenido prohibido",
};

const FIRMA: Record<EstadoFirma, { icono: typeof CheckIcon; clase: string; label: string }> = {
  firmada: { icono: CheckIcon, clase: "text-ok", label: "firmó" },
  enviada: { icono: ClockIcon, clase: "text-warn", label: "esperando firma" },
  pendiente: { icono: ClockIcon, clase: "text-warn", label: "sin enviar" },
  rechazada: { icono: XIcon, clase: "text-bad", label: "no aceptó" },
  retirada: { icono: XIcon, clase: "text-bad", label: "retiró su consentimiento" },
};

type Filtro = "todos" | "terceros" | "video";

export function Moderacion({ cola, detalle, motivos }: { cola: ItemCola[]; detalle: DetalleSet | null; motivos: Motivo[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState(motivos[0]?.codigo ?? "");
  const [todas, setTodas] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  const visibles = cola.filter((c) => filtro === "todos" || (filtro === "terceros" ? c.conOtras : c.video));
  const indice = detalle ? cola.findIndex((c) => c.id === detalle.id) : -1;
  const siguiente = cola[indice + 1] ?? cola.find((c) => c.id !== detalle?.id);

  const sinFirma = detalle?.personas.some((p) => p.estado !== "firmada") || (detalle?.conOtras && !detalle.personas.length);
  const bloqueo = !detalle
    ? null
    : !detalle.verificada
      ? "La creadora no está verificada."
      : sinFirma
        ? "Alguien aparece sin firmar."
        : null;

  const irA = useCallback(
    (id?: string) => {
      setRechazando(false);
      setTodas(false);
      setError(undefined);
      router.push(id ? `/panel/moderacion?set=${id}` : "/panel/moderacion");
    },
    [router],
  );

  const resolver = useCallback(
    (decision: "aprobado" | "rechazado") => {
      if (!detalle) return;
      setError(undefined);
      iniciar(async () => {
        const r = await decidir(detalle.id, decision, motivo);
        if (!r.ok) return setError(r.error);
        // Al decidir avanza al siguiente pendiente.
        irA(siguiente?.id);
      });
    },
    [detalle, motivo, siguiente, irA],
  );

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.metaKey || e.ctrlKey || e.altKey || ocupado || !detalle) return;
      const k = e.key.toLowerCase();
      if (k === "a" && !bloqueo && !rechazando) resolver("aprobado");
      else if (k === "r") {
        if (rechazando) resolver("rechazado");
        else setRechazando(true);
      }
      else if (k === "j" && siguiente) irA(siguiente.id);
      else if (k === "escape") setRechazando(false);
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [bloqueo, rechazando, resolver, siguiente, irA, ocupado, detalle]);

  const textoMotivo = motivos.find((m) => m.codigo === motivo)?.texto_para_creadora;
  const fotos = detalle?.fotos ?? [];
  const resto = fotos.length - 4;

  return (
    <div className="grid min-h-0 grid-cols-[340px_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col border-r border-line">
        <div className="flex items-baseline justify-between px-[18px] pt-5 pb-3">
          <h1 className="m-0 font-display text-[22px] font-semibold">Pendientes</h1>
          <span className="text-[13px] text-muted">
            {cola.length}
            {cola[0]?.enviadoEn && ` · más antiguo ${hace(cola[0].enviadoEn).replace("hace ", "")}`}
          </span>
        </div>
        <Chips
          label="Filtrar cola"
          className="px-[18px] pb-3"
          valor={filtro}
          onChange={setFiltro}
          opciones={[
            { valor: "todos", label: "Todos" },
            { valor: "terceros", label: "Con terceros" },
            { valor: "video", label: "Video" },
          ]}
        />
        <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
          {visibles.length === 0 && (
            <li className="border-t border-line px-[18px] py-6 text-sm text-muted">
              {cola.length ? "Nada con este filtro." : "No hay sets esperando. La cola está al día."}
            </li>
          )}
          {visibles.map((c) => (
            <li key={c.id}>
              <Link
                href={`/panel/moderacion?set=${c.id}`}
                aria-current={c.id === detalle?.id ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 border-t border-line px-[18px] py-3 text-text! no-underline",
                  c.id === detalle?.id ? "bg-surface-2" : "hover:bg-surface",
                )}
              >
                {c.portada ? (
                  <Velo fuente={{ src: c.portada }} className="size-[52px] flex-none rounded-[12px]" />
                ) : (
                  <span className="size-[52px] flex-none rounded-[12px] bg-surface-2" />
                )}
                <span className="min-w-0 flex-1 leading-[1.35]">
                  <span className="block truncate text-sm font-bold">{c.titulo}</span>
                  <span className="block truncate text-xs text-muted">
                    {c.creadora} · {cuantasFotos(c.fotos)}
                    {c.conOtras && " · con terceros"}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 text-xs">
                  <span className="text-muted">{hace(c.enviadoEn)}</span>
                  <Estado tono="warn" className="text-xs">
                    Pendiente
                  </Estado>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!detalle ? (
        <section className="grid place-items-center p-10 text-center">
          <div className="flex max-w-sm flex-col gap-2">
            <h2 className="m-0 font-display text-[26px] font-semibold">Todo revisado</h2>
            <p className="m-0 text-[15px] text-muted">Cuando una creadora envíe un set, aparece aquí. El objetivo es decidir en menos de 2 h.</p>
          </div>
        </section>
      ) : (
        <section className="flex min-h-0 flex-col overflow-y-auto">
          <div className="flex items-start gap-4 px-7 pt-5">
            <div className="flex-1">
              <h2 className="m-0 font-display text-[26px] font-semibold">{detalle.titulo}</h2>
              <p className="m-0 mt-0.5 text-sm text-muted">
                {detalle.creadora} · {cuantasFotos(fotos.length)} · {detalle.precio > 0 ? precioMXN(detalle.precio) : "Gratis"}
              </p>
            </div>
            <Estado tono="warn" className="pt-2">
              Pendiente
            </Estado>
          </div>

          {todas ? (
            <div className="grid grid-cols-4 gap-2 px-7 pt-[18px]">
              {fotos.map((f, i) => (
                <a key={f} href={f} target="_blank" rel="noreferrer" aria-label={`Foto ${i + 1}`}>
                  <span className="block aspect-[3/4] rounded-[22px] bg-cover bg-center" style={{ backgroundImage: `url("${f}")` }} />
                </a>
              ))}
            </div>
          ) : (
            <div className="grid h-[220px] grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-7 pt-[18px]">
              {fotos.slice(0, 4).map((f, i) =>
                i === 3 && resto > 0 ? (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTodas(true)}
                    className="relative cursor-pointer overflow-hidden rounded-[22px] bg-cover bg-center"
                    style={{ backgroundImage: `url("${f}")` }}
                  >
                    <span className="absolute inset-0 grid place-items-center bg-surface-2/85 text-sm font-bold text-text">+{resto}</span>
                  </button>
                ) : (
                  <a
                    key={f}
                    href={f}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Foto ${i + 1}`}
                    className="relative rounded-[22px] bg-cover bg-center"
                    style={{ backgroundImage: `url("${f}")` }}
                  >
                    {i === 0 && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-black/28 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white">
                        1 de {fotos.length}
                      </span>
                    )}
                  </a>
                ),
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-7 px-7 pt-5">
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-bold">Creadora</span>
              <div className="flex items-center gap-3">
                <Avatar iniciales={iniciales(detalle.creadora)} tamano={40} />
                <div className="leading-[1.35]">
                  <div className="text-[15px] font-bold">{detalle.creadora}</div>
                  {detalle.verificada ? (
                    <div className="flex items-center gap-1.5 text-[13px] text-ok">
                      <CheckIcon weight="bold" size={14} />
                      Identidad verificada{detalle.edad ? ` · ${detalle.edad} años` : ""}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[13px] text-bad">
                      <XIcon weight="bold" size={14} />
                      Sin verificar ·{" "}
                      <Link href="/panel/verificaciones" className="font-bold">
                        revisar
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[13px] text-muted">{detalle.historial}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-bold">Personas que aparecen</span>
              {detalle.personas.length === 0 ? (
                <span className="text-sm text-muted">
                  {detalle.conOtras ? "Dijo que aparece alguien, pero no agregó a nadie." : "Solo la creadora."}
                </span>
              ) : (
                detalle.personas.map((p) => {
                  const { icono: Icono, clase, label } = FIRMA[p.estado];
                  return (
                    <span key={p.id} className="flex items-center gap-2.5 text-sm">
                      <Icono weight="bold" size={18} className={clase} />
                      <span className="flex-1">
                        <span className="font-mono text-[13px]">{p.telefono}</span> · {label}
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {rechazando && (
            <div className="mx-7 mt-[18px] flex flex-col gap-2.5">
              <span className="text-[13px] font-bold">Motivo · la creadora lo leerá tal cual</span>
              <Chips
                label="Motivo de rechazo"
                valor={motivo}
                onChange={setMotivo}
                opciones={motivos.map((m) => ({ valor: m.codigo, label: NOMBRE_MOTIVO[m.codigo] ?? m.codigo }))}
              />
              <p className="m-0 rounded-[22px] border border-line bg-surface px-[18px] py-3 text-sm leading-normal">{textoMotivo}</p>
            </div>
          )}

          <div className="mt-auto flex items-center gap-2.5 border-t border-line px-7 pt-4 pb-6">
            <span className="flex-1 text-[13px] text-muted">
              {error ? (
                <b className="text-bad">{error}</b>
              ) : bloqueo ? (
                <b className="text-bad">{bloqueo}</b>
              ) : (
                "Atajos: A aprobar · R rechazar · J siguiente"
              )}
            </span>
            {rechazando && (
              <Boton variante="texto" tono="apagado" onClick={() => setRechazando(false)}>
                Cancelar
              </Boton>
            )}
            <Boton
              variante="secundario"
              className="w-auto! text-bad!"
              icono={<XIcon weight="bold" size={18} />}
              disabled={ocupado}
              onClick={() => (rechazando ? resolver("rechazado") : setRechazando(true))}
            >
              {rechazando ? "Rechazar con este motivo" : "Rechazar"}
            </Boton>
            {!rechazando && (
              <Boton
                className="w-auto! px-7"
                icono={<CheckIcon weight="bold" size={18} />}
                disabled={!!bloqueo || ocupado}
                onClick={() => resolver("aprobado")}
              >
                Aprobar y publicar
              </Boton>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AreaTexto, Avatar, Boton, Campo, Estado } from "@/components/ui";
import { cn } from "@/lib/cn";
import { iniciales } from "@/lib/texto";
import { hace } from "@/lib/tiempo";
import { decidirCreadora } from "./acciones";

export type CreadoraPendiente = {
  id: string;
  nombre: string;
  usuario: string | null;
  edad: number | null;
  nacimiento: string | null;
  creadaEn: string;
  correo: string | null;
  intentos: { estado: string; proveedor: string | null; motivo: string | null; creada_en: string }[];
  /** INE y selfie del intento pendiente (links de 10 min). */
  fotos: { label: string; url: string }[];
};

const INTENTO: Record<string, string> = {
  pendiente: "En revisión",
  aprobada: "Aprobada",
  pide_otra_foto: "Pidió otra foto",
  rechazada: "Rechazada",
};

export function Verificaciones({ lista, elegida }: { lista: CreadoraPendiente[]; elegida: CreadoraPendiente | null }) {
  const router = useRouter();
  const [nota, setNota] = useState("");
  const [nombreLegal, setNombreLegal] = useState("");
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  function decidir(estado: "aprobada" | "rechazada" | "pide_otra_foto") {
    if (!elegida) return;
    setError(undefined);
    iniciar(async () => {
      const r = await decidirCreadora(elegida.id, estado, nota, nombreLegal);
      if (!r.ok) return setError(r.error);
      setNota("");
      setNombreLegal("");
      const siguiente = lista.find((c) => c.id !== elegida.id);
      router.push(siguiente ? `/panel/verificaciones?creadora=${siguiente.id}` : "/panel/verificaciones");
    });
  }

  const menor = elegida?.edad !== null && elegida?.edad !== undefined && elegida.edad < 18;

  return (
    <div className="grid min-h-0 grid-cols-[340px_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col border-r border-line">
        <div className="flex items-baseline justify-between px-[18px] pt-5 pb-3">
          <h1 className="m-0 font-display text-[22px] font-semibold">Verificaciones</h1>
          <span className="text-[13px] text-muted">{lista.length}</span>
        </div>
        <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
          {lista.length === 0 && <li className="border-t border-line px-[18px] py-6 text-sm text-muted">Nadie esperando verificación.</li>}
          {lista.map((c) => (
            <li key={c.id}>
              <Link
                href={`/panel/verificaciones?creadora=${c.id}`}
                className={cn(
                  "flex items-center gap-3 border-t border-line px-[18px] py-3 text-text! no-underline",
                  c.id === elegida?.id ? "bg-surface-2" : "hover:bg-surface",
                )}
              >
                <Avatar iniciales={iniciales(c.nombre)} tamano={40} />
                <span className="min-w-0 flex-1 leading-[1.35]">
                  <span className="block truncate text-sm font-bold">{c.nombre}</span>
                  <span className="block truncate font-mono text-xs text-muted">{c.usuario ?? "sin link"}</span>
                </span>
                <span className="text-xs text-muted">{hace(c.creadaEn)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!elegida ? (
        <section className="grid place-items-center p-10 text-center">
          <div className="flex max-w-sm flex-col gap-2">
            <h2 className="m-0 font-display text-[26px] font-semibold">Nadie en espera</h2>
            <p className="m-0 text-[15px] text-muted">Las creadoras nuevas aparecen aquí después de registrarse.</p>
          </div>
        </section>
      ) : (
        <section className="flex min-h-0 flex-col overflow-y-auto">
          <div className="flex items-start gap-4 px-7 pt-5">
            <div className="flex-1">
              <h2 className="m-0 font-display text-[26px] font-semibold">{elegida.nombre}</h2>
              <p className="m-0 mt-0.5 font-mono text-[13px] text-muted">{elegida.correo ?? "sin correo"}</p>
            </div>
            <Estado tono="warn" className="pt-2">
              Sin verificar
            </Estado>
          </div>

          {elegida.fotos.length > 0 ? (
            <div className="grid h-[220px] grid-cols-[1.586fr_1.586fr_1fr] gap-2 px-7 pt-5">
              {elegida.fotos.map((f) => (
                <a
                  key={f.label}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative rounded-[22px] border border-line bg-cover bg-center"
                  style={{ backgroundImage: `url("${f.url}")` }}
                >
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/28 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white">
                    {f.label}
                  </span>
                </a>
              ))}
            </div>
          ) : null}

          <div className="mx-7 mt-5 flex gap-3 rounded-[22px] bg-warn-soft px-[18px] py-3.5 text-sm leading-normal text-warn">
            <WarningIcon weight="bold" size={20} className="mt-px flex-none" />
            <span>
              {elegida.fotos.length > 0
                ? "Sin proveedor de prueba de vida todavía: compara a mano la selfie con la INE, revisa que la INE esté vigente y que la fecha de nacimiento coincida."
                : "No ha subido INE ni selfie. Aprueba solo si verificaste su identificación y su edad por otro medio, y anota cómo."}
            </span>
          </div>

          <dl className="m-0 grid grid-cols-[160px_1fr] gap-x-6 gap-y-3 px-7 pt-6 text-sm">
            <dt className="text-muted">Link</dt>
            <dd className="m-0 font-mono text-[13px]">{elegida.usuario ?? "No ha elegido link"}</dd>
            <dt className="text-muted">Fecha de nacimiento</dt>
            <dd className={cn("m-0", menor && "font-bold text-bad")}>
              {elegida.nacimiento ? `${elegida.nacimiento} · ${elegida.edad} años` : "No la ha capturado"}
            </dd>
            <dt className="text-muted">Cuenta creada</dt>
            <dd className="m-0">{hace(elegida.creadaEn)}</dd>
            <dt className="text-muted">Intentos</dt>
            <dd className="m-0 flex flex-col gap-1">
              {elegida.intentos.length === 0
                ? "Ninguno"
                : elegida.intentos.map((i) => (
                    <span key={i.creada_en}>
                      {INTENTO[i.estado] ?? i.estado} · {i.proveedor ?? "sin proveedor"} · {hace(i.creada_en)}
                      {i.motivo && <span className="block text-muted">{i.motivo}</span>}
                    </span>
                  ))}
            </dd>
          </dl>

          <Campo
            label="Nombre como aparece en la INE"
            className="px-7 pt-6"
            value={nombreLegal}
            onChange={(e) => setNombreLegal(e.target.value)}
            placeholder="Valeria Ruiz Ochoa"
            ayuda="Es el titular de su CLABE. Solo hace falta para aprobar."
          />
          <AreaTexto
            label="Nota de la decisión"
            className="px-7 pt-4"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={300}
            placeholder="Selfie coincide con la INE; vigente hasta 2031. Si pides otra foto, explica qué falta: ella lo lee."
          />

          <div className="mt-auto flex items-center gap-2.5 border-t border-line px-7 pt-4 pb-6">
            <span className="flex-1 text-[13px]">
              {error ? <b className="text-bad">{error}</b> : <span className="text-muted">La decisión queda registrada con tu nombre.</span>}
            </span>
            <Boton variante="secundario" className="w-auto! text-bad!" disabled={ocupado} onClick={() => decidir("rechazada")}>
              Rechazar
            </Boton>
            {elegida.fotos.length > 0 && (
              <Boton variante="secundario" className="w-auto!" disabled={ocupado} onClick={() => decidir("pide_otra_foto")}>
                Pedir otra foto
              </Boton>
            )}
            <Boton className="w-auto! px-7" disabled={ocupado || menor || !elegida.nacimiento} onClick={() => decidir("aprobada")}>
              Aprobar a mano
            </Boton>
          </div>
        </section>
      )}
    </div>
  );
}

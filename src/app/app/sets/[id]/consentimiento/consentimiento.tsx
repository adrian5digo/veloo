"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Boton, Campo, DatoCopiable, Estado, OpcionGrande, ZonaCTA, type Tono } from "@/components/ui";
import type { Database } from "@/lib/database.types";
import { agregarPersona, enviarARevision, marcarOtrasPersonas, nuevoLinkFirma, quitarPersona } from "./acciones";

type EstadoFirma = Database["public"]["Enums"]["estado_firma"];

export type Persona = { id: string; telefono: string; estado: EstadoFirma };

const FIRMA: Record<EstadoFirma, { tono: Tono; label: string }> = {
  pendiente: { tono: "neutro", label: "Sin enviar" },
  enviada: { tono: "warn", label: "Esperando su firma" },
  firmada: { tono: "ok", label: "Firmó" },
  rechazada: { tono: "bad", label: "No aceptó aparecer" },
  retirada: { tono: "bad", label: "Retiró su consentimiento" },
};

/** C4b · Nuevo set, paso 2 de 2: otras personas, declaración y envío a revisión. */
export function Consentimiento({
  setId,
  titulo,
  conOtrasInicial,
  motivoRechazo,
  personas,
}: {
  setId: string;
  titulo: string;
  conOtrasInicial: boolean;
  /** Si lo rechazaron (E4), el texto exacto del motivo. */
  motivoRechazo: string | null;
  personas: Persona[];
}) {
  const router = useRouter();
  const [conOtras, setConOtras] = useState(conOtrasInicial);
  const [telefono, setTelefono] = useState("");
  const [link, setLink] = useState<string>();
  const [declaro, setDeclaro] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  const [enviando, setEnviando] = useState(false);

  const faltanFirmas = conOtras && (personas.length === 0 || personas.some((p) => p.estado !== "firmada"));
  const bloqueado = !declaro || faltanFirmas || ocupado;

  function correr(accion: () => Promise<{ ok: true; link?: string } | { ok: false; error: string }>) {
    setError(undefined);
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) return setError(r.error);
      if (r.link) setLink(r.link);
    });
  }

  function elegir(si: boolean) {
    if (si === conOtras) return;
    setConOtras(si);
    correr(() => marcarOtrasPersonas(setId, si));
  }

  function agregar() {
    correr(async () => {
      const r = await agregarPersona(setId, telefono);
      if (r.ok) setTelefono("");
      return r;
    });
  }

  function enviar() {
    setError(undefined);
    setEnviando(true);
    iniciar(async () => {
      const r = await enviarARevision(setId, declaro);
      if (r.ok) return router.push("/app/boveda");
      setError(r.error);
      setEnviando(false);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <Link
          href="/app/boveda"
          aria-label="Volver a la bóveda"
          className="-ml-2.5 grid size-11 place-items-center text-text!"
        >
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <span className="flex-1 truncate text-base font-semibold">{motivoRechazo ? titulo : "Nuevo set"}</span>
        {!motivoRechazo && <span className="text-[13px] text-muted">2 de 2</span>}
      </header>

      {motivoRechazo && (
        <section className="flex flex-col gap-2 px-6 pb-5">
          <Estado tono="bad">No lo publicamos</Estado>
          <p className="m-0 text-[15px] leading-normal text-text">{motivoRechazo}</p>
          <p className="m-0 text-[13px] text-muted">
            Tus fotos siguen guardadas. Corrige lo que falta y vuelve a enviarlo.
          </p>
        </section>
      )}

      <div className="flex flex-col gap-2 px-6 pt-1">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.01em]">
          ¿Aparece otra persona?
        </h1>
        <p className="m-0 text-sm leading-normal text-pretty text-muted">
          Cualquier persona visible tiene que ser mayor de edad y firmar su consentimiento antes de publicar.
        </p>
      </div>

      <div role="radiogroup" aria-label="¿Aparece otra persona?" className="grid grid-cols-2 gap-2 px-5 pt-5">
        <OpcionGrande seleccionada={!conOtras} onSelect={() => elegir(false)} className="min-h-14 rounded-full">
          No, solo yo
        </OpcionGrande>
        <OpcionGrande seleccionada={conOtras} onSelect={() => elegir(true)} className="min-h-14 rounded-full">
          Sí
        </OpcionGrande>
      </div>

      {conOtras && (
        <section className="flex flex-col gap-2.5 px-5 pt-[18px]">
          {personas.map((p) => {
            const { tono, label } = FIRMA[p.estado];
            const reenviable = p.estado === "pendiente" || p.estado === "enviada";
            return (
              <div key={p.id} className="flex flex-col gap-1 rounded-[22px] border border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-mono text-[13px]">{p.telefono}</span>
                  <Estado tono={tono} className="text-[13px]">
                    {label}
                  </Estado>
                </div>
                <div className="-mx-3 -mb-2 flex justify-end">
                  {reenviable && (
                    <Boton
                      variante="texto"
                      onClick={() => correr(() => nuevoLinkFirma(setId, p.id))}
                      disabled={ocupado}
                    >
                      Link nuevo
                    </Boton>
                  )}
                  <Boton
                    variante="texto"
                    tono="apagado"
                    onClick={() => correr(() => quitarPersona(setId, p.id))}
                    disabled={ocupado}
                  >
                    Quitar
                  </Boton>
                </div>
              </div>
            );
          })}

          {link && <DatoCopiable label="Mándale este link por WhatsApp" valor={link} />}
          {link && (
            <p className="m-0 px-1 text-[13px] text-muted">Solo lo verás ahora. Si lo pierdes, pide un link nuevo.</p>
          )}

          <Campo
            label={personas.length ? "¿Aparece alguien más?" : "Envíale el formulario"}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="+52 55 1234 5678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <Boton variante="secundario" onClick={agregar} disabled={ocupado || telefono.replace(/\D/g, "").length < 10}>
            Crear link de firma
          </Boton>

          <div className="flex flex-col gap-2 rounded-[22px] bg-surface-2 p-4 text-sm">
            <span className="font-semibold">Lo que recibirá</span>
            {["Foto de su INE, frente y reverso", "Selfie en vivo", "Firma de consentimiento para este set"].map(
              (t, i) => (
                <span key={t} className="flex gap-2 text-muted">
                  <span className="font-semibold text-accent-ink">{i + 1}</span>
                  {t}
                </span>
              ),
            )}
          </div>
        </section>
      )}

      <label className="mx-5 mt-5 flex cursor-pointer items-start gap-2.5 text-sm leading-[1.45] text-pretty">
        <input
          type="checkbox"
          checked={declaro}
          onChange={(e) => setDeclaro(e.target.checked)}
          className="mt-px size-5 flex-none accent-accent"
        />
        Confirmo que no hay desnudos ni contenido sexual, que todas las personas son mayores de 18 y aceptaron aparecer, y que tengo los derechos de estas fotos.
      </label>

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={enviar} disabled={bloqueado}>
          {enviando ? "Enviando…" : faltanFirmas ? "Esperando firmas" : "Enviar a revisión"}
        </Boton>
        <p className="m-0 text-center text-xs text-muted">Revisamos cada set antes de publicarlo (menos de 2 h)</p>
      </ZonaCTA>
    </main>
  );
}

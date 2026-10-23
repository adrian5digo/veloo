"use client";

import { CaretLeftIcon, CheckCircleIcon, ImagesIcon, UserIcon, UsersIcon, IdentificationCardIcon, CameraIcon, SignatureIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
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
  publicacionDirecta,
}: {
  setId: string;
  titulo: string;
  conOtrasInicial: boolean;
  /** Si lo rechazaron (E4), el texto exacto del motivo. */
  motivoRechazo: string | null;
  personas: Persona[];
  publicacionDirecta: boolean;
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
    setError(undefined);
    iniciar(async () => {
      try {
        const r = await marcarOtrasPersonas(setId, si);
        if (!r.ok) { setConOtras(!si); setError(r.error); }
      } catch {
        setConOtras(!si);
        setError("No pudimos guardar tu selección. Tus fotos siguen guardadas; vuelve a elegir.");
      }
    });
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
      if (r.ok) return router.push(`/app/sets/${setId}`);
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
          ¿Quién aparece?
        </h1>
        <ol aria-label="Pasos para crear un set" className="m-0 mt-2 flex list-none items-center gap-3 p-0 text-[13px] font-semibold">
          <li className="flex items-center gap-2 text-muted"><CheckCircleIcon size={22} weight="fill" aria-hidden /> Fotos guardadas</li>
          <li aria-hidden className="h-px flex-1 bg-line" />
          <li aria-current="step" className="flex items-center gap-2 text-accent-ink"><UsersIcon size={22} weight="bold" aria-hidden /> Confirmar</li>
        </ol>
      </div>

      <div role="radiogroup" aria-label="¿Quién aparece en las fotos?" className="grid gap-3 px-5 pt-5">
        <OpcionGrande seleccionada={!conOtras} onSelect={() => elegir(false)} disabled={ocupado} icono={<UserIcon size={28} weight="bold" aria-hidden />}>
          Solo aparezco yo
        </OpcionGrande>
        <OpcionGrande seleccionada={conOtras} onSelect={() => elegir(true)} disabled={ocupado} icono={<UsersIcon size={28} weight="bold" aria-hidden />} detalle="Mayores de 18, con firma">
          Aparece alguien más
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
            <span className="font-semibold">Cada persona necesita</span>
            {([[IdentificationCardIcon, "INE: frente y reverso"], [CameraIcon, "Selfie en vivo"], [SignatureIcon, "Firma para este set"]] as const).map(
              ([Icono, t]) => (
                <span key={t} className="flex items-center gap-2 text-muted">
                  <Icono size={20} weight="bold" className="text-accent-ink" aria-hidden />
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
        <span className="flex flex-col gap-2">
          <span className="font-bold">Confirmo que:</span>
          <span className="flex items-center gap-2"><ShieldCheckIcon size={20} weight="bold" className="shrink-0 text-accent-ink" aria-hidden /> No hay desnudos ni contenido sexual.</span>
          <span className="flex items-center gap-2"><UsersIcon size={20} weight="bold" className="shrink-0 text-accent-ink" aria-hidden /> Todas las personas son mayores de 18 y aceptaron aparecer.</span>
          <span className="flex items-center gap-2"><ImagesIcon size={20} weight="bold" className="shrink-0 text-accent-ink" aria-hidden /> Tengo los derechos de las fotos.</span>
        </span>
      </label>

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={enviar} disabled={bloqueado}>
          {enviando ? "Guardando…" : faltanFirmas ? "Faltan firmas para continuar" : publicacionDirecta ? "Publicar mi set" : "Enviar mi set a revisión"}
        </Boton>
        {(faltanFirmas || !declaro) && <p className="m-0 text-center text-[13px] text-muted">{faltanFirmas ? "Comparte los links para reunir las firmas." : "Marca la confirmación para terminar."}</p>}
      </ZonaCTA>
    </main>
  );
}

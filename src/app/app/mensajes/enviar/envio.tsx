"use client";

import { useState, useTransition } from "react";
import { Encabezado } from "@/components/creadora/encabezado";
import type { Adjuntable } from "@/components/mensajes/hilo";
import { AreaTexto, Boton, Estado, OpcionGrande, Segmentado, Velo, ZonaCTA } from "@/components/ui";
import { precio } from "@/lib/dinero";
import { urlVelo } from "@/lib/medios";
import { enviarSet } from "../acciones";

type Grupo = "compradores" | "suscriptores" | "seguidores";

const DETALLE: Record<Grupo, string> = {
  compradores: "Quienes te han comprado al menos un set.",
  suscriptores: "Quienes tienen tu suscripción activa (ya lo ven completo).",
  seguidores: "Quienes te siguen en Veloo, aunque no te hayan comprado.",
};

/** C14 · Elegir set, grupo y un mensaje opcional. No le llega a quien ya lo tiene. Máximo 3 al día. */
export function Envio({ sets, inicial }: { sets: Adjuntable[]; inicial: string | null }) {
  const [setId, setSetId] = useState(inicial);
  const [grupo, setGrupo] = useState<Grupo>("compradores");
  const [texto, setTexto] = useState("");
  const [enviados, setEnviados] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  function mandar() {
    if (!setId) return;
    setError(undefined);
    iniciar(async () => {
      const r = await enviarSet(setId, grupo, texto);
      if (r.ok) setEnviados(r.enviados);
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/mensajes" titulo="Mandar un set" />

      {sets.length === 0 ? (
        <section className="flex flex-col gap-2 px-6 pt-6">
          <h1 className="m-0 font-display text-2xl font-semibold">Primero publica un set</h1>
          <p className="m-0 text-[15px] leading-normal text-muted">Cuando tengas uno publicado, aquí se lo mandas a tus fans con velo y su precio.</p>
          <Boton variante="secundario" href="/app/subir" className="mt-4">
            Subir un set
          </Boton>
        </section>
      ) : (
        <>
          <section role="radiogroup" aria-label="Set" className="flex flex-col gap-2 px-5">
            <span className="pb-1 text-[13px] font-semibold">¿Cuál set?</span>
            {sets.map((s) => (
              <OpcionGrande key={s.id} seleccionada={setId === s.id} onSelect={() => setSetId(s.id)} className="justify-start p-2.5">
                <span className="flex w-full items-center gap-3 text-left">
                  {s.portadaId ? (
                    <Velo fuente={{ src: urlVelo(s.portadaId, "mini") }} className="size-12 flex-none rounded-[12px]" />
                  ) : (
                    <span className="size-12 flex-none rounded-[12px] bg-surface-2" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{s.titulo}</span>
                  <span className="pr-1.5 font-display text-[17px] font-semibold">{s.precio > 0 ? precio(s.precio) : "Gratis"}</span>
                </span>
              </OpcionGrande>
            ))}
          </section>

          <section className="flex flex-col gap-2 px-5 pt-6">
            <span className="text-[13px] font-semibold">¿A quién?</span>
            <Segmentado
              label="Grupo"
              valor={grupo}
              onChange={setGrupo}
              opciones={[
                { valor: "compradores", label: "Compradores" },
                { valor: "suscriptores", label: "Suscriptores" },
                { valor: "seguidores", label: "Seguidores" },
              ]}
            />
            <p className="m-0 px-1 text-[13px] text-muted">{DETALLE[grupo]}</p>
          </section>

          <AreaTexto
            label="Mensaje (opcional)"
            className="px-5 pt-6"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Subí uno nuevo, te va a gustar"
            contador
          />

          <ZonaCTA className="gap-2">
            {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
            {enviados !== null && (
              <Estado tono={enviados > 0 ? "ok" : "neutro"} className="self-center whitespace-normal">
                {enviados === 0 ? "No hay a quién mandarlo en ese grupo (quien ya lo tiene no cuenta)" : enviados === 1 ? "Le llegó a 1 fan" : `Le llegó a ${enviados} fans`}
              </Estado>
            )}
            <Boton onClick={mandar} disabled={!setId || ocupado}>
              {ocupado ? "Mandando…" : "Mandar a mis fans"}
            </Boton>
            <p className="m-0 text-center text-xs text-muted">Les llega con velo y su precio. Hasta 3 envíos al día.</p>
          </ZonaCTA>
        </>
      )}
    </main>
  );
}

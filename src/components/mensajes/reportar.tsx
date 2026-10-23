"use client";

import { DotsThreeIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useTransition } from "react";
import { bloquearFan } from "@/app/app/mensajes/acciones";
import { reportarConversacion } from "@/app/mensajes/acciones";
import { AreaTexto, Boton, Estado, OpcionGrande } from "@/components/ui";
import type { Database } from "@/lib/database.types";

type Motivo = Database["public"]["Enums"]["motivo_reporte"];

const MOTIVOS: { valor: Motivo; label: string }[] = [
  { valor: "acoso", label: "Me molesta o insiste" },
  { valor: "posible_menor", label: "Puede ser menor de edad" },
  { valor: "contenido_prohibido", label: "Pide o manda contenido sexual" },
  { valor: "datos_personales", label: "Pide o comparte datos personales" },
  { valor: "spam", label: "Spam o fraude" },
  { valor: "otro", label: "Otra cosa" },
];

/**
 * Menú de la conversación: reportarla (solo así la lee el equipo) y, para la creadora, bloquear.
 * Hoja flotante; la única con sombra en esta pantalla.
 */
export function MenuConversacion({ conversacionId, puedeBloquear }: { conversacionId: string; /** Solo la creadora. */ puedeBloquear?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [detalle, setDetalle] = useState("");
  const [folio, setFolio] = useState<string>();
  const [bloqueado, setBloqueado] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  function reportar() {
    if (!motivo) return;
    setError(undefined);
    iniciar(async () => {
      const r = await reportarConversacion(conversacionId, motivo, detalle);
      if (r.ok) setFolio(r.folio);
      else setError(r.error);
    });
  }

  function bloquearlo() {
    setError(undefined);
    iniciar(async () => {
      const r = await bloquearFan(conversacionId);
      if (r.ok) setBloqueado(true);
      else setError(r.error);
    });
  }

  return (
    <>
      <button type="button" aria-label="Más opciones" onClick={() => setAbierta(true)} className="grid size-11 cursor-pointer place-items-center text-muted">
        <DotsThreeIcon weight="bold" size={20} />
      </button>
      {abierta && (
        <div role="dialog" aria-modal aria-label="Reportar conversación" className="fixed inset-0 z-20 flex items-end justify-center bg-black/30" onClick={() => setAbierta(false)}>
          <div
            className="flex max-h-[85dvh] w-full max-w-[480px] flex-col gap-3 overflow-y-auto rounded-t-[26px] bg-bg px-5 pt-5 pb-7 shadow-[var(--shadow)]"
            onClick={(e) => e.stopPropagation()}
          >
            {folio ? (
              <>
                <h2 className="m-0 font-display text-xl font-semibold">Recibimos tu reporte</h2>
                <p className="m-0 text-sm leading-normal text-muted">
                  Folio <span className="font-mono">{folio}</span>. El equipo revisa esta conversación; los de posible menor de edad, en menos de 1 hora. Nadie más la ve.
                </p>
                <Boton variante="secundario" onClick={() => setAbierta(false)}>
                  Listo
                </Boton>
              </>
            ) : (
              <>
                <h2 className="m-0 font-display text-xl font-semibold">Reportar esta conversación</h2>
                <p className="m-0 text-[13px] text-muted">Solo si la reportas, el equipo de Veloo la puede leer.</p>
                <div role="radiogroup" aria-label="Motivo" className="flex flex-col gap-2">
                  {MOTIVOS.map((m) => (
                    <OpcionGrande key={m.valor} seleccionada={motivo === m.valor} onSelect={() => setMotivo(m.valor)} className="min-h-13 justify-start">
                      {m.label}
                    </OpcionGrande>
                  ))}
                </div>
                <AreaTexto label="Cuéntanos más (opcional)" value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={1000} rows={3} />
                {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
                <Boton variante="secundario" onClick={reportar} disabled={!motivo || ocupado}>
                  {ocupado ? "Enviando…" : "Enviar reporte"}
                </Boton>
                {puedeBloquear &&
                  (bloqueado ? (
                    <Estado tono="ok" className="self-center">
                      Bloqueado: ya no te puede escribir ni comprar
                    </Estado>
                  ) : (
                    <Boton variante="texto" tono="peligro" onClick={bloquearlo} disabled={ocupado}>
                      Bloquear a este fan
                    </Boton>
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

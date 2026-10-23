"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Encabezado } from "@/components/creadora/encabezado";
import { Boton, Campo, Chips, Estado, FilaToggle, ZonaCTA } from "@/components/ui";
import { cifra, netoCreadora } from "@/lib/dinero";
import { guardarSuscripcion } from "../acciones";

const SUGERIDOS = ["99", "149", "199"] as const;

/** C16 · Suscripción mensual con tokens (1 token = $1). Comisión 20%, como en los sets. */
export function Suscripcion({ tokens, activas, seRenuevan, neto30 }: { tokens: number | null; activas: number; seRenuevan: number; neto30: number }) {
  const router = useRouter();
  const [prendida, setPrendida] = useState(tokens !== null);
  const [monto, setMonto] = useState(String(tokens ?? 149));
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  const valor = Number(monto) || 0;
  const valido = !prendida || (valor >= 49 && valor <= 2000);
  const cambio = prendida !== (tokens !== null) || (prendida && valor !== tokens);

  function guardar() {
    setError(undefined);
    setGuardado(false);
    iniciar(async () => {
      const r = await guardarSuscripcion(prendida ? valor : null);
      if (!r.ok) return setError(r.error);
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/perfil" titulo="Suscripción mensual" />

      <p className="m-0 px-5 text-[15px] leading-normal text-pretty text-muted">
        Tus fans pagan tokens cada mes y ven todos tus sets, los de ahora y los que publiques. Se renueva sola con su saldo; si no les alcanza, se detiene.
      </p>

      <div className="px-5 pt-5">
        <FilaToggle titulo="Ofrecer suscripción" detalle="Aparece en tu página, arriba de tus sets" activo={prendida} onChange={setPrendida} />
      </div>

      {prendida && (
        <div className="flex flex-col gap-2 px-5 pt-[18px]">
          <Campo
            label="Precio al mes"
            inputMode="numeric"
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/\D/g, "").slice(0, 4))}
            sufijo={<span className="text-[13px]">tokens</span>}
            error={valor > 0 && !valido ? "Va de 49 a 2,000 tokens." : undefined}
          />
          <Chips
            label="Precios sugeridos"
            tono="acento"
            valor={(SUGERIDOS as readonly string[]).includes(monto) ? monto : ""}
            onChange={setMonto}
            opciones={SUGERIDOS.map((s) => ({ valor: s, label: `${s} tokens` }))}
          />
          {valido && valor > 0 && (
            <p className="m-0 text-[13px] text-muted">
              Recibes <b className="font-semibold text-text">{cifra(netoCreadora(valor))}</b> por suscriptor al mes · comisión 20%
            </p>
          )}
          {tokens !== null && valor !== tokens && (
            <p className="m-0 text-[13px] text-muted">El precio nuevo aplica a quien se suscriba después. Quien ya está suscrito sigue con {tokens} tokens.</p>
          )}
        </div>
      )}
      {!prendida && tokens !== null && activas > 0 && (
        <p className="m-0 px-5 pt-3 text-[13px] text-muted">Si la apagas, nadie nuevo se suscribe y las actuales ya no se renuevan. Siguen viendo todo hasta su fecha.</p>
      )}

      <section className="flex flex-col px-5 pt-7">
        <h2 className="m-0 mb-1 text-[13px] font-semibold">Ahora</h2>
        <div className="flex justify-between border-b border-line py-2.5 text-sm">
          <span>Suscripciones activas</span>
          <b className="font-semibold">{activas}</b>
        </div>
        <div className="flex justify-between border-b border-line py-2.5 text-sm">
          <span>Se renuevan</span>
          <b className="font-semibold">{seRenuevan}</b>
        </div>
        <div className="flex justify-between py-2.5 text-sm">
          <span>Neto, últimos 30 días</span>
          <b className="font-semibold">{cifra(neto30)}</b>
        </div>
      </section>

      <ZonaCTA className="gap-2">
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        {guardado && !cambio && (
          <Estado tono="ok" className="self-center">
            Guardado
          </Estado>
        )}
        <Boton onClick={guardar} disabled={!cambio || !valido || ocupado}>
          {ocupado ? "Guardando…" : "Guardar"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

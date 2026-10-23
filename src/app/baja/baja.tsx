"use client";

import { useState, useTransition } from "react";
import { Boton, Estado, ZonaCTA } from "@/components/ui";
import { confirmarBaja } from "./acciones";

export function Baja({ correo, creadoraId, token, nombre }: { correo: string; creadoraId: string; token: string; nombre: string }) {
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(false);
  const [ocupado, iniciar] = useTransition();

  function confirmar() {
    iniciar(async () => {
      const r = await confirmarBaja(correo, creadoraId, token);
      if (r.ok) setListo(true);
      else setError(true);
    });
  }

  return (
    <>
      <section className="flex flex-col gap-2.5 px-7 pt-24">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">
          {listo ? "Listo, ya no te escribimos" : `¿Dejar de recibir avisos de ${nombre}?`}
        </h1>
        <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
          {listo
            ? `No te llegan más correos de ${nombre} a ${correo}. Tus compras y tu suscripción no cambian.`
            : `Ya no te avisaremos a ${correo} cuando publique o te mande un set. Tus compras siguen igual.`}
        </p>
        {listo && <Estado tono="ok">Baja confirmada</Estado>}
        {error && <p className="m-0 text-[13px] font-semibold text-bad">Este link ya no es válido. Escríbenos a hola@veloo.vip.</p>}
      </section>
      {!listo && (
        <ZonaCTA>
          <Boton variante="secundario" onClick={confirmar} disabled={ocupado}>
            {ocupado ? "Un momento…" : "Sí, ya no quiero avisos"}
          </Boton>
        </ZonaCTA>
      )}
    </>
  );
}

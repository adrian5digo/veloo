"use client";

import { useState, useTransition } from "react";
import { Boton } from "@/components/ui";
import { cambiarBloqueo } from "./acciones";

export function Bloqueo({ ordenId, bloqueado }: { ordenId: string; bloqueado: boolean }) {
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  function cambiar() {
    setError(undefined);
    iniciar(async () => {
      const r = await cambiarBloqueo(ordenId, !bloqueado);
      if (r.error) setError(r.error);
    });
  }
  return (
    <>
      {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
      {bloqueado ? (
        <>
          <p className="m-0 text-center text-[13px] text-muted">Este fan ya no puede comprarte. Lo que compró sigue siendo suyo.</p>
          <Boton variante="texto" tono="apagado" onClick={cambiar} disabled={ocupado}>
            Desbloquear
          </Boton>
        </>
      ) : (
        <Boton variante="secundario" onClick={cambiar} disabled={ocupado}>
          Bloquear a este fan
        </Boton>
      )}
    </>
  );
}

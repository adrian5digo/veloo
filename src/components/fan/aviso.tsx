"use client";

import { useState, useTransition } from "react";
import { pedirAviso } from "@/app/u/[usuario]/acciones";
import { Boton, Campo, Estado } from "@/components/ui";

/**
 * F1 · "Avísame": quien llega desde una historia deja su correo para el próximo set.
 * `principal` cuando es la única acción de la página (todavía no hay sets ni suscripción).
 */
export function Aviso({ creadoraId, nombre, principal }: { creadoraId: string; nombre: string; principal: boolean }) {
  const [correo, setCorreo] = useState("");
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    iniciar(async () => {
      const r = await pedirAviso(creadoraId, correo);
      if (r.ok) setListo(true);
      else setError(r.error);
    });
  }

  if (listo) {
    return (
      <div className="flex flex-col gap-1 py-1">
        <Estado tono="ok">Te avisamos a {correo.trim().toLowerCase()}</Estado>
        <p className="m-0 text-[13px] text-muted">Un solo correo cuando {nombre} publique. Nada más.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2.5">
      <Campo
        label={`Avísame cuando ${nombre} publique`}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={error}
        ayuda="Un solo correo por set nuevo. Sin cuenta."
        required
      />
      <Boton type="submit" variante={principal ? "primario" : "secundario"} disabled={ocupado || !correo.trim()}>
        {ocupado ? "Guardando…" : "Avísame"}
      </Boton>
    </form>
  );
}

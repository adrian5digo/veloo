"use client";

import { Hilo, type Adjuntable } from "@/components/mensajes/hilo";
import type { Mensaje } from "@/server/mensajes";
import { responder } from "../acciones";

/** Hilo del lado de la creadora: contesta y adjunta sus sets publicados. */
export function HiloCreadora({
  conversacionId,
  mensajes,
  bloqueo,
  adjuntables,
}: {
  conversacionId: string;
  mensajes: Mensaje[];
  bloqueo?: string;
  adjuntables: Adjuntable[];
}) {
  return (
    <Hilo
      yo="creadora"
      mensajes={mensajes}
      bloqueo={bloqueo}
      adjuntables={adjuntables}
      enviar={(texto, setId) => responder(conversacionId, texto, setId)}
    />
  );
}

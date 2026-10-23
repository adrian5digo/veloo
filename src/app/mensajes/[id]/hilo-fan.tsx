"use client";

import { useRouter } from "next/navigation";
import { Hilo } from "@/components/mensajes/hilo";
import type { Mensaje } from "@/server/mensajes";
import { escribirACreadora } from "../acciones";

/** Hilo del lado del fan. Al primer mensaje (conversación nueva) lleva a su página. */
export function HiloFan({
  creadoraId,
  mensajes,
  bloqueo,
  nueva,
}: {
  creadoraId: string;
  mensajes: Mensaje[];
  bloqueo?: string;
  /** Todavía no hay conversación: al enviar se crea y se abre. */
  nueva?: boolean;
}) {
  const router = useRouter();
  return (
    <Hilo
      yo="fan"
      mensajes={mensajes}
      bloqueo={bloqueo}
      enviar={async (texto) => {
        const r = await escribirACreadora(creadoraId, texto);
        if (r.ok && nueva && r.conversacion) router.replace(`/mensajes/${r.conversacion}`);
        return r.ok ? { ok: true } : { ok: false, error: r.error };
      }}
    />
  );
}

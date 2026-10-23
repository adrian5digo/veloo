"use client";

import { useState } from "react";
import { linkPublico } from "@/lib/links";

/** S3 "Compartir": hoja nativa si existe; si no, copia el link. */
export function Compartir({ usuario, nombre }: { usuario: string; nombre: string }) {
  const [copiado, setCopiado] = useState(false);
  async function compartir() {
    const url = linkPublico(usuario, undefined, window.location.origin);
    if (navigator.share) {
      try {
        await navigator.share({ title: nombre, url });
      } catch {
        // Cerró la hoja: no es error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles: nada que hacer.
    }
  }
  return (
    <button type="button" onClick={compartir} className="grid min-h-12 cursor-pointer place-items-center rounded-full border border-line bg-surface px-5 text-[15px] text-text">
      {copiado ? "Link copiado" : "Compartir"}
    </button>
  );
}

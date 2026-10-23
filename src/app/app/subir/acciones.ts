"use server";

import { ID_MEDIO } from "@/lib/medios";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";

export type ResultadoBorrador = { ok: true; setId: string } | { ok: false; error: string };

/** Guarda el set como borrador con sus fotos en orden. La primera es la portada. */
export async function guardarBorrador(datos: { titulo: string; precio: number; fotoIds: string[] }): Promise<ResultadoBorrador> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: "Tu sesión se cerró. Entra de nuevo; tus fotos siguen subidas." };

  const titulo = datos.titulo.trim();
  const fotoIds = [...new Set(datos.fotoIds)];
  if (!titulo || titulo.length > 60) return { ok: false, error: "Ponle un título de hasta 60 letras." };
  if (!Number.isInteger(datos.precio) || datos.precio <= 0 || datos.precio > 99999) {
    return { ok: false, error: "Revisa el precio: va en pesos, sin centavos." };
  }
  if (fotoIds.length === 0 || !fotoIds.every((id) => ID_MEDIO.test(id))) {
    return { ok: false, error: "Sube al menos una foto." };
  }

  // RLS: solo regresa fotos de esta creadora.
  const supabase = await supabaseServidor();
  const { data: fotos, error: e1 } = await supabase
    .from("medios")
    .select("id")
    .in("id", fotoIds)
    .eq("estado", "lista")
    .is("set_id", null);
  if (e1) throw e1;
  if (fotos.length !== fotoIds.length) {
    return { ok: false, error: "Alguna foto no terminó de procesarse. Espera a que todas tengan velo." };
  }

  const { data: set, error: e2 } = await supabase
    .from("sets")
    .insert({
      creadora_id: creadora.id,
      titulo,
      precio_centavos: datos.precio * 100,
      portada_id: fotoIds[0],
    })
    .select("id")
    .single<{ id: string }>();
  if (e2) throw e2;

  const resultados = await Promise.all(
    fotoIds.map((id, orden) => supabase.from("medios").update({ set_id: set.id, orden }).eq("id", id)),
  );
  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) throw fallo.error;

  return { ok: true, setId: set.id };
}

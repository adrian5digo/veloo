import { prepararSubida } from "@/server/medios";
import { creadoraActual } from "@/server/sesion";

/** Pide permiso para subir una foto. Devuelve un link firmado para subirla directo a storage. */
export async function POST() {
  const creadora = await creadoraActual();
  if (!creadora) return Response.json({ error: "Inicia sesión para subir." }, { status: 401 });
  return Response.json(await prepararSubida(creadora.id), { status: 201 });
}

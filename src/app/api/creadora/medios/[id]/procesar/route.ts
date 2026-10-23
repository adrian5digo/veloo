import { ErrorMedio, procesarFoto } from "@/server/medios";
import { creadoraActual } from "@/server/sesion";

/** Genera la versión limpia, la vista nítida y los velos de una foto ya subida. */
export async function POST(_request: Request, ctx: RouteContext<"/api/creadora/medios/[id]/procesar">) {
  const creadora = await creadoraActual();
  if (!creadora) return Response.json({ error: "Inicia sesión para subir." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    return Response.json(await procesarFoto(id, creadora.id));
  } catch (e) {
    if (e instanceof ErrorMedio) return Response.json({ error: e.message }, { status: 422 });
    throw e;
  }
}

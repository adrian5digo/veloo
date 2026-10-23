import { borrarFoto } from "@/server/medios";
import { creadoraActual } from "@/server/sesion";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/creadora/medios/[id]">) {
  const creadora = await creadoraActual();
  if (!creadora) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  const borrada = await borrarFoto(id, creadora.id);
  return new Response(null, { status: borrada ? 204 : 404 });
}

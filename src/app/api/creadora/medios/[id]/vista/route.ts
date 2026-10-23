import { urlVista } from "@/server/medios";
import { creadoraActual } from "@/server/sesion";

/** Versión nítida para "mantener presionado" en la bóveda. Solo la dueña; link de 60 s. */
export async function GET(_request: Request, ctx: RouteContext<"/api/creadora/medios/[id]/vista">) {
  const creadora = await creadoraActual();
  if (!creadora) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  const url = await urlVista(id, creadora.id);
  if (!url) return new Response(null, { status: 404 });
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } });
}

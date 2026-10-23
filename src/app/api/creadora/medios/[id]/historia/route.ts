import { portadaHistoria } from "@/server/medios";
import { creadoraActual } from "@/server/sesion";

export async function GET(_request: Request, ctx: RouteContext<"/api/creadora/medios/[id]/historia">) {
  const creadora = await creadoraActual();
  if (!creadora) return new Response(null, { status: 401 });
  const { id } = await ctx.params;
  const imagen = await portadaHistoria(id, creadora.id);
  if (!imagen) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(imagen), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

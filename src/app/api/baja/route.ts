import { ID_MEDIO } from "@/lib/medios";
import { bajaValida } from "@/server/correo";
import { supabaseAdmin } from "@/server/supabase";

/** List-Unsubscribe de un clic (RFC 8058): Gmail y Apple Mail mandan un POST a esta URL. */
export async function POST(request: Request) {
  const q = new URL(request.url).searchParams;
  const e = q.get("e") ?? "";
  const c = q.get("c") ?? "";
  const t = q.get("t") ?? "";
  if (!ID_MEDIO.test(c) || !bajaValida(e, c, t)) return new Response(null, { status: 400 });
  const { error } = await supabaseAdmin().rpc("dar_de_baja", { p_correo: e, p_creadora: c });
  if (error) throw error;
  return new Response(null, { status: 200 });
}

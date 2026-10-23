import "server-only";
import { rutaPublica } from "@/lib/links";
import { supabaseServidor } from "./supabase";

/**
 * Inbox entre fan y creadora. Los mensajes se leen con la sesión (RLS: solo los dos participantes);
 * se escriben por funciones de la base, que revisan compra, edad, bloqueos y límites.
 */

export type SetAdjunto = {
  id: string;
  titulo: string;
  precio: number;
  portadaId: string | null;
  /** A dónde lleva al tocarlo. */
  href: string;
  /** El fan ya lo puede ver (lo compró o está incluido en su suscripción). */
  abierto: boolean;
};

export type Mensaje = { id: number; autor: "fan" | "creadora"; texto: string | null; set: SetAdjunto | null; creadoEn: string };

/** Últimos 100 mensajes de una conversación, del más viejo al más nuevo. null si no es suya. */
export async function hilo(conversacionId: string, lado: "fan" | "creadora") {
  const supabase = await supabaseServidor();
  const { data: conv } = await supabase.from("conversaciones").select("id, creadora_id, fan_id").eq("id", conversacionId).maybeSingle();
  if (!conv) return null;

  const { data: filas, error } = await supabase
    .from("mensajes")
    .select("id, autor, texto, set_id, creado_en")
    .eq("conversacion_id", conversacionId)
    .order("id", { ascending: false })
    .limit(100);
  if (error) throw error;

  const ids = [...new Set(filas.map((m) => m.set_id).filter((x): x is string => !!x))];
  const { data: sets } = ids.length
    ? await supabase.from("sets").select("id, slug, titulo, precio_centavos, portada_id, creadoras(usuario)").in("id", ids).eq("estado", "publicado")
    : { data: [] };

  // Del lado del fan: ¿cuáles ya puede ver?
  const compradas = new Map<string, string>();
  let suscrito = false;
  if (lado === "fan" && ids.length) {
    const [{ data: compras }, { data: sus }] = await Promise.all([
      supabase.from("mis_compras").select("id, set_id").in("set_id", ids).eq("estado", "pagada"),
      supabase.from("mis_suscripciones").select("activa").eq("creadora_id", conv.creadora_id).maybeSingle(),
    ]);
    for (const c of compras ?? []) if (c.set_id) compradas.set(c.set_id, c.id!);
    suscrito = !!sus?.activa;
  }

  const porId = new Map(
    (sets ?? []).map((s) => {
      const usuario = s.creadoras?.usuario ?? "";
      const orden = compradas.get(s.id);
      const adjunto: SetAdjunto = {
        id: s.id,
        titulo: s.titulo,
        precio: s.precio_centavos / 100,
        portadaId: s.portada_id,
        href: lado === "creadora" ? `/app/sets/${s.id}` : orden ? `/mis-compras/${orden}` : suscrito ? `/ver/${s.id}` : rutaPublica(usuario, s.slug),
        abierto: lado === "fan" && (!!orden || suscrito || s.precio_centavos === 0),
      };
      return [s.id, adjunto];
    }),
  );

  const mensajes: Mensaje[] = filas
    .reverse()
    // Un set que ya no está publicado y no traía texto no tiene nada que mostrar.
    .filter((m) => m.texto || (m.set_id && porId.has(m.set_id)))
    .map((m) => ({
      id: m.id,
      autor: m.autor as Mensaje["autor"],
      texto: m.texto,
      set: m.set_id ? (porId.get(m.set_id) ?? null) : null,
      creadoEn: m.creado_en,
    }));

  return { conversacion: conv, mensajes };
}

/** ¿Hay mensajes sin leer? Para el punto en la pestaña de Mensajes. */
export async function haySinLeer(lado: "fan" | "creadora") {
  const supabase = await supabaseServidor();
  const vista = lado === "fan" ? "bandeja_fan" : "bandeja_creadora";
  const { count } = await supabase.from(vista).select("id", { count: "exact", head: true }).eq("sin_leer", true);
  return (count ?? 0) > 0;
}

/** Texto de la última línea en una bandeja. */
export function vistaPrevia(fila: { ultimo_texto: string | null; ultimo_con_set: boolean | null; ultimo_autor: string | null }, yo: "fan" | "creadora") {
  const mio = fila.ultimo_autor === yo;
  if (fila.ultimo_texto) return (mio ? "Tú: " : "") + fila.ultimo_texto;
  if (!fila.ultimo_con_set) return "";
  return mio ? "Mandaste un set" : "Te mandó un set";
}

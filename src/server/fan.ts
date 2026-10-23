import "server-only";
import { supabaseAdmin, supabaseServidor } from "./supabase";

/**
 * Lado social y compras del fan. Comprar no pide cuenta: las compras se ligan al correo,
 * así que cualquier sesión con ese correo las ve (vista mis_compras).
 */

export type Fan = { id: string; correo: string };

export async function fanActual(): Promise<Fan | null> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, correo: (user.email ?? "").toLowerCase() } : null;
}

/** La fila de fans es opcional (L3); seguir y dar me gusta la necesitan. */
export async function asegurarFan(id: string) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("fans").upsert({ id }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

/**
 * F7: fotos de un set comprado. Solo si la orden está pagada y es de esta sesión (RLS de mis_compras).
 * Links firmados de 10 min a la vista nítida; la descarga es el original limpio (sin EXIF).
 */
export async function contenidoDeCompra(ordenId: string) {
  const supabase = await supabaseServidor();
  const { data: compra, error } = await supabase.from("mis_compras").select("*").eq("id", ordenId).eq("estado", "pagada").maybeSingle();
  if (error) throw error;
  if (!compra) return null;

  const contenido = await fotosDeSet(compra.set_id!, compra.titulo!);
  return contenido && { compra, ...contenido };
}

/** Fotos de un set ya pagado: vista nítida (10 min) y descarga del original limpio, sin EXIF. */
export async function fotosDeSet(setId: string, titulo: string) {
  const db = supabaseAdmin();
  const { data: set } = await db.from("sets").select("creadora_id").eq("id", setId).single();
  const { data: medios } = await db.from("medios").select("id, tipo").eq("set_id", setId).eq("estado", "lista").order("orden");
  if (!set || !medios) return null;

  const fotos = medios.filter((m) => m.tipo === "foto");
  const ruta = (id: string, archivo: string) => `${set.creadora_id}/${id}/${archivo}`;
  const [vistas, originales] = await Promise.all([
    db.storage.from("privado").createSignedUrls(fotos.map((m) => ruta(m.id, "vista.webp")), 600),
    Promise.all(fotos.map((m) => db.storage.from("privado").createSignedUrl(ruta(m.id, "original.jpg"), 600, { download: `${titulo}-${m.id.slice(0, 6)}.jpg` }))),
  ]);
  if (vistas.error) throw vistas.error;

  return {
    fotos: fotos.map((m, i) => ({ id: m.id, vista: vistas.data[i]?.signedUrl ?? null, descarga: originales[i].data?.signedUrl ?? null })),
    videos: medios.length - fotos.length,
  };
}

/** ¿Ya confirmó ser mayor de 18? Se pide una vez, antes de comprar tokens. */
export async function mayorDeEdad(fanId: string) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.from("fans").select("mayor_edad_en").eq("id", fanId).maybeSingle();
  return !!data?.mayor_edad_en;
}

export type Relacion = {
  /** Le ha comprado al menos un set (por cuenta o por correo). */
  compro: boolean;
  suscripcion: { activa: boolean; hasta: string; renovar: boolean; tokens: number } | null;
};

/** Lo que este fan tiene con una creadora: compras y suscripción. Decide si puede escribirle o ver sus sets. */
export async function relacionCon(creadora: { id: string; usuario: string }): Promise<Relacion> {
  const supabase = await supabaseServidor();
  const [{ data: compra }, { data: sus }] = await Promise.all([
    supabase.from("mis_compras").select("id").eq("creadora_usuario", creadora.usuario).eq("estado", "pagada").limit(1).maybeSingle(),
    supabase.from("mis_suscripciones").select("activa, periodo_hasta, renovar, tokens").eq("creadora_id", creadora.id).maybeSingle(),
  ]);
  return {
    compro: !!compra,
    suscripcion: sus && { activa: !!sus.activa, hasta: sus.periodo_hasta!, renovar: !!sus.renovar, tokens: sus.tokens! },
  };
}

/** F7 por suscripción: fotos de un set de una creadora a la que está suscrito, sin haberlo comprado. */
export async function contenidoPorSuscripcion(setId: string) {
  const supabase = await supabaseServidor();
  const { data: puede, error } = await supabase.rpc("ver_por_suscripcion", { p_set: setId });
  if (error) throw error;
  if (!puede) return null;
  const { data: set } = await supabaseAdmin().from("sets").select("id, titulo, creadoras(usuario)").eq("id", setId).single();
  if (!set) return null;
  const contenido = await fotosDeSet(set.id, set.titulo);
  return contenido && { titulo: set.titulo, usuario: set.creadoras?.usuario ?? null, ...contenido };
}

/** Portadas sin velo (sets gratis o ya comprados): links firmados de 10 min a la vista. */
export async function portadasNitidas(ids: (string | null)[]) {
  const validos = ids.filter((x): x is string => !!x);
  const mapa = new Map<string, string>();
  if (!validos.length) return mapa;
  const db = supabaseAdmin();
  const { data: medios } = await db.from("medios").select("id, creadora_id").in("id", validos);
  if (!medios?.length) return mapa;
  const { data } = await db.storage.from("privado").createSignedUrls(medios.map((m) => `${m.creadora_id}/${m.id}/vista.webp`), 600);
  medios.forEach((m, i) => data?.[i]?.signedUrl && mapa.set(m.id, data[i].signedUrl));
  return mapa;
}

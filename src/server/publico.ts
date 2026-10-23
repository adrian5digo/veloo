import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import type { Red } from "@/lib/redes";
import { supabaseAdmin, supabaseServidor } from "./supabase";

/**
 * Datos públicos del lado del fan. Usa la sesión (o anon): RLS solo deja ver creadoras
 * verificadas, sets publicados y sus medios listos. Nunca hay URLs nítidas aquí.
 */

export type SetPublico = {
  id: string;
  slug: string;
  titulo: string;
  precio: number;
  portadaId: string | null;
  fotos: number;
  video: boolean;
  publicadoEn: string | null;
};

export type PerfilPublico = {
  id: string;
  usuario: string;
  nombre: string;
  bio: string | null;
  avatarPath: string | null;
  /** Sus otras redes y páginas (tipo Linktree), en su orden. La URL no viaja: el botón va por /l/[id]. */
  links: { id: string; titulo: string; red: Red }[];
  /** Tokens al mes de su suscripción; null si no ofrece. */
  suscripcionTokens: number | null;
  /** Si los fans que ya le compraron pueden escribirle. */
  mensajesAbiertos: boolean;
  sets: SetPublico[];
};

/** Con cache: la usan generateMetadata y la página en la misma petición. */
export const perfilPublico = cache(async (usuario: string): Promise<PerfilPublico | null> => {
  if (!/^[a-z0-9-]{3,30}$/.test(usuario)) return null;
  const supabase = await supabaseServidor();
  const { data: c, error } = await supabase
    .from("creadoras")
    .select("id, usuario, nombre, bio, avatar_path, suscripcion_tokens, mensajes_abiertos")
    .eq("usuario", usuario)
    .eq("verificacion", "aprobada")
    .maybeSingle();
  if (error) throw error;
  if (!c) return null;

  const [{ data: sets, error: e2 }, { data: links, error: e4 }] = await Promise.all([
    supabase
      .from("sets")
      .select("id, slug, titulo, precio_centavos, portada_id, publicado_en")
      .eq("creadora_id", c.id)
      .eq("estado", "publicado")
      .order("publicado_en", { ascending: false }),
    supabase.from("links_creadora").select("id, titulo, red").eq("creadora_id", c.id).eq("activo", true).order("orden"),
  ]);
  if (e2) throw e2;
  if (e4) throw e4;

  const ids = sets.map((s) => s.id);
  const { data: medios, error: e3 } = ids.length
    ? await supabase.from("medios").select("set_id, tipo").in("set_id", ids)
    : { data: [], error: null };
  if (e3) throw e3;

  return {
    id: c.id,
    usuario: c.usuario!,
    nombre: c.nombre || c.usuario!,
    bio: c.bio,
    avatarPath: c.avatar_path,
    links,
    suscripcionTokens: c.suscripcion_tokens,
    mensajesAbiertos: c.mensajes_abiertos,
    sets: sets.map((s) => {
      const suyos = medios.filter((m) => m.set_id === s.id);
      return {
        id: s.id,
        slug: s.slug,
        titulo: s.titulo,
        precio: s.precio_centavos / 100,
        portadaId: s.portada_id,
        fotos: suyos.length,
        video: suyos.some((m) => m.tipo === "video"),
        publicadoEn: s.publicado_en,
      };
    }),
  };
});

/** Para E5: ¿la creadora quitó este set, o simplemente no está disponible? */
export async function setRetirado(creadoraId: string, slug: string) {
  const { data } = await supabaseAdmin()
    .from("sets")
    .select("estado")
    .eq("creadora_id", creadoraId)
    .eq("slug", slug)
    .maybeSingle();
  return data?.estado === "retirado";
}

/** "Nuevo" en F1 durante la primera semana. */
export function esNuevo(publicadoEn: string | null) {
  return !!publicadoEn && Date.now() - new Date(publicadoEn).getTime() < 7 * 24 * 3600 * 1000;
}

/**
 * C8 "Bloquear países": ¿se le oculta este perfil a quien visita? Usa el país que manda Vercel;
 * sin ese header (desarrollo) no bloquea.
 */
export async function bloqueadoPorPais(creadoraId: string) {
  const pais = (await headers()).get("x-vercel-ip-country");
  if (!pais) return false;
  const { data } = await supabaseAdmin().from("ajustes_creadora").select("paises_bloqueados").eq("creadora_id", creadoraId).maybeSingle();
  return !!data?.paises_bloqueados.includes(pais.toUpperCase());
}

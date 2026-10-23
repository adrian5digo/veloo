"use server";

import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { normalizarUrl, redDe } from "@/lib/redes";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true } | { ok: false; error: string };
const SESION = "Tu sesión se cerró. Entra de nuevo; no se perdió nada.";

function validar(url: string, titulo: string): { url: string; titulo: string } | string {
  const limpia = normalizarUrl(url);
  if (!limpia) return "Revisa el link: pégalo completo, como instagram.com/tuusuario.";
  const t = titulo.trim();
  if (!t || t.length > 40) return "El nombre del botón va de 1 a 40 letras.";
  return { url: limpia, titulo: t };
}

function refrescar() {
  revalidatePath("/app/perfil", "layout");
  revalidatePath("/u/[usuario]", "page");
}

/** Agrega un link al final de la lista. La red (ícono) sale del dominio. */
export async function crearLink(url: string, titulo: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  const v = validar(url, titulo);
  if (typeof v === "string") return { ok: false, error: v };

  const supabase = await supabaseServidor();
  const { data: ultimo } = await supabase.from("links_creadora").select("orden").eq("creadora_id", creadora.id).order("orden", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("links_creadora")
    .insert({ creadora_id: creadora.id, ...v, red: redDe(v.url), orden: (ultimo?.orden ?? -1) + 1 })
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("limite_links")) return { ok: false, error: "Ya tienes 20 links. Borra uno para agregar otro." };
    throw error;
  }
  refrescar();
  return { ok: true, id: data.id };
}

export async function editarLink(id: string, url: string, titulo: string): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  if (!ID_MEDIO.test(id)) return { ok: false, error: "No encontramos ese link." };
  const v = validar(url, titulo);
  if (typeof v === "string") return { ok: false, error: v };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("links_creadora").update({ ...v, red: redDe(v.url) }).eq("id", id);
  if (error) throw error;
  refrescar();
  return { ok: true };
}

export async function alternarLink(id: string, activo: boolean): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  if (!ID_MEDIO.test(id)) return { ok: false, error: "No encontramos ese link." };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("links_creadora").update({ activo }).eq("id", id);
  if (error) throw error;
  refrescar();
  return { ok: true };
}

export async function borrarLink(id: string): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  if (!ID_MEDIO.test(id)) return { ok: false, error: "No encontramos ese link." };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("links_creadora").delete().eq("id", id);
  if (error) throw error;
  refrescar();
  return { ok: true };
}

/** Guarda el orden completo (los ids en el orden en que se ven). RLS solo deja tocar los propios. */
export async function ordenarLinks(ids: string[]): Promise<Resultado> {
  const creadora = await creadoraActual();
  if (!creadora) return { ok: false, error: SESION };
  if (ids.length > 20 || !ids.every((id) => ID_MEDIO.test(id))) return { ok: false, error: "No pudimos guardar el orden. Intenta de nuevo." };
  const supabase = await supabaseServidor();
  const resultados = await Promise.all(ids.map((id, orden) => supabase.from("links_creadora").update({ orden }).eq("id", id)));
  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) throw fallo.error;
  refrescar();
  return { ok: true };
}

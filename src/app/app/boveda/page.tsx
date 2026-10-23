import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { haySinLeer } from "@/server/mensajes";
import { supabaseServidor } from "@/server/supabase";
import { Boveda, type ItemBoveda } from "./boveda";

export const metadata: Metadata = { title: "Bóveda · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/boveda");

  const supabase = await supabaseServidor();
  const { data: perfil } = await supabase.from("creadoras").select("usuario").eq("id", creadora.id).single();
  // Sin link todavía: primero el registro (C1b).
  if (!perfil?.usuario) redirect("/app/registro");

  // Filtrar por creadora: RLS también deja ver los sets publicados de otras.
  const [{ data: sets, error: e1 }, { data: ventas, error: e2 }] = await Promise.all([
    supabase
      .from("sets")
      .select("id, titulo, precio_centavos, estado, portada_id")
      .eq("creadora_id", creadora.id)
      .neq("estado", "retirado")
      .order("creado_en", { ascending: false }),
    supabase.from("mis_ventas").select("set_id").eq("estado", "pagada"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const ventasPorSet = new Map<string, number>();
  for (const v of ventas ?? []) if (v.set_id) ventasPorSet.set(v.set_id, (ventasPorSet.get(v.set_id) ?? 0) + 1);

  const items: ItemBoveda[] = (sets ?? []).map((s) => ({
    id: s.id,
    titulo: s.titulo,
    precio: s.precio_centavos / 100,
    estado: s.estado as ItemBoveda["estado"],
    portadaId: s.portada_id,
    ventas: ventasPorSet.get(s.id) ?? 0,
  }));

  return <Boveda items={items} sinLeer={await haySinLeer("creadora")} />;
}

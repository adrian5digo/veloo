import { supabaseAdmin } from "@/server/supabase";
import { registrarAcceso, staffActual } from "@/server/staff";
import { edadDe } from "@/lib/tiempo";
import { urlVelo } from "@/lib/medios";
import { Moderacion, type DetalleSet, type ItemCola } from "./moderacion";

/** A1 · Moderación: cola de sets en revisión y detalle sin velo (queda registrado). */
export default async function Page({ searchParams }: PageProps<"/panel/moderacion">) {
  const staff = (await staffActual())!;
  const db = supabaseAdmin();
  const { set: pedido } = await searchParams;

  const { data: cola, error } = await db
    .from("sets")
    .select("id, titulo, precio_centavos, enviado_en, portada_id, con_otras_personas, creadora_id, creadoras(usuario, nombre)")
    .eq("estado", "moderacion")
    .order("enviado_en", { ascending: true });
  if (error) throw error;

  const ids = cola.map((s) => s.id);
  const { data: medios, error: e2 } = ids.length
    ? await db.from("medios").select("id, set_id, tipo, orden").in("set_id", ids).order("orden")
    : { data: [], error: null };
  if (e2) throw e2;

  const items: ItemCola[] = cola.map((s) => {
    const suyos = medios.filter((m) => m.set_id === s.id);
    return {
      id: s.id,
      titulo: s.titulo,
      creadora: s.creadoras?.nombre || s.creadoras?.usuario || "Sin nombre",
      fotos: suyos.length,
      video: suyos.some((m) => m.tipo === "video"),
      conOtras: s.con_otras_personas,
      enviadoEn: s.enviado_en,
      portada: s.portada_id ? urlVelo(s.portada_id, "mini") : null,
    };
  });

  const elegido = cola.find((s) => s.id === pedido) ?? cola[0];
  let detalle: DetalleSet | null = null;

  if (elegido) {
    const suyos = medios.filter((m) => m.set_id === elegido.id);
    const [firmadas, privado, historial, personas] = await Promise.all([
      db.storage.from("privado").createSignedUrls(
        suyos.map((m) => `${elegido.creadora_id}/${m.id}/vista.webp`),
        600,
      ),
      db.from("creadoras").select("verificacion, creadoras_privado(fecha_nacimiento)").eq("id", elegido.creadora_id).single(),
      db.from("sets").select("estado").eq("creadora_id", elegido.creadora_id).in("estado", ["publicado", "rechazado"]),
      db.from("personas_set").select("id, telefono, estado_firma").eq("set_id", elegido.id).order("creado_en"),
    ]);
    if (firmadas.error) throw firmadas.error;
    if (privado.error) throw privado.error;
    // Ver fotos sin velo queda registrado.
    await registrarAcceso(staff.id, "ver_set_sin_velo", "set", elegido.id);

    const publicados = historial.data?.filter((h) => h.estado === "publicado").length ?? 0;
    const rechazados = historial.data?.filter((h) => h.estado === "rechazado").length ?? 0;
    detalle = {
      id: elegido.id,
      titulo: elegido.titulo,
      precio: elegido.precio_centavos / 100,
      creadora: items.find((i) => i.id === elegido.id)!.creadora,
      verificada: privado.data.verificacion === "aprobada",
      edad: edadDe(privado.data.creadoras_privado?.fecha_nacimiento ?? null),
      historial:
        publicados + rechazados === 0
          ? "Es su primer set."
          : `${publicados} ${publicados === 1 ? "set publicado" : "sets publicados"} · ${rechazados} ${rechazados === 1 ? "rechazado" : "rechazados"}`,
      fotos: (firmadas.data ?? []).map((f) => f.signedUrl).filter((u): u is string => !!u),
      conOtras: elegido.con_otras_personas,
      personas: (personas.data ?? []).map((p) => ({
        id: p.id,
        telefono: `••• ${p.telefono.slice(-4)}`,
        estado: p.estado_firma,
      })),
    };
  }

  const { data: motivos } = await db.from("motivos_rechazo").select("codigo, texto_para_creadora").eq("activo", true);

  return <Moderacion cola={items} detalle={detalle} motivos={motivos ?? []} />;
}

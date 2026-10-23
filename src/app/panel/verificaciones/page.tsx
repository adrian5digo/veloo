import { registrarAcceso, staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";
import { edadDe } from "@/lib/tiempo";
import { urlsIdentidad } from "@/server/identidad";
import { Verificaciones, type CreadoraPendiente } from "./verificaciones";

/** A2 · Verificación (manual, mientras no hay proveedor de identidad). */
export default async function Page({ searchParams }: PageProps<"/panel/verificaciones">) {
  const staff = (await staffActual())!;
  const db = supabaseAdmin();
  const { creadora: pedida } = await searchParams;

  const { data, error } = await db
    .from("creadoras")
    .select("id, usuario, nombre, verificacion, creada_en, creadoras_privado(fecha_nacimiento)")
    .in("verificacion", ["pendiente", "en_revision"])
    .order("creada_en", { ascending: true });
  if (error) throw error;

  const lista: CreadoraPendiente[] = data.map((c) => ({
    id: c.id,
    nombre: c.nombre || c.usuario || "Sin registro",
    usuario: c.usuario,
    edad: edadDe(c.creadoras_privado?.fecha_nacimiento ?? null),
    nacimiento: c.creadoras_privado?.fecha_nacimiento ?? null,
    creadaEn: c.creada_en,
    correo: null,
    intentos: [],
    fotos: [],
  }));

  const elegida = lista.find((c) => c.id === pedida) ?? lista[0];
  if (elegida) {
    const [{ data: usuario }, { data: intentos }] = await Promise.all([
      db.auth.admin.getUserById(elegida.id),
      db
        .from("verificaciones")
        .select("estado, proveedor, motivo, creada_en, ine_frente_path, ine_reverso_path, selfie_path")
        .eq("creadora_id", elegida.id)
        .order("creada_en", { ascending: false }),
    ]);
    elegida.correo = usuario.user?.email ?? null;
    elegida.intentos = (intentos ?? []).map(({ estado, proveedor, motivo, creada_en }) => ({ estado, proveedor, motivo, creada_en }));
    const ultimo = intentos?.[0];
    if (ultimo?.estado === "pendiente") {
      const [frente, reverso, selfie] = await urlsIdentidad([ultimo.ine_frente_path, ultimo.ine_reverso_path, ultimo.selfie_path]);
      elegida.fotos = [
        { label: "INE frente", url: frente },
        { label: "INE reverso", url: reverso },
        { label: "Selfie", url: selfie },
      ].filter((f): f is { label: string; url: string } => !!f.url);
    }
    // Ver datos de identidad queda registrado.
    await registrarAcceso(staff.id, "ver_identidad", "creadora", elegida.id);
  }

  return <Verificaciones lista={lista} elegida={elegida ?? null} />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { isoHaceDias } from "@/lib/tiempo";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Editar } from "./editar";

export const metadata: Metadata = { title: "Editar perfil · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/perfil/editar");
  const supabase = await supabaseServidor();
  const { data: c } = await supabase
    .from("creadoras")
    .select("usuario, nombre, bio, avatar_path, usuario_cambiado_en")
    .eq("id", creadora.id)
    .single();
  if (!c?.usuario) redirect("/app/registro");
  // Mismo cálculo que limitar_cambio_usuario(): 90 días desde la última vez que se fijó el link.
  const puede = !c.usuario_cambiado_en || c.usuario_cambiado_en < isoHaceDias(90);

  return (
    <Editar
      nombre={c.nombre ?? ""}
      bio={c.bio ?? ""}
      usuario={c.usuario}
      avatar={urlAvatar(c.avatar_path)}
      iniciales={iniciales(c.nombre || c.usuario)}
      puedeCambiarLink={puede}
    />
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { haySinLeer } from "@/server/mensajes";
import { supabaseServidor } from "@/server/supabase";
import { iniciales } from "@/lib/texto";
import { urlAvatar } from "@/lib/medios";
import { Perfil } from "./perfil";

export const metadata: Metadata = { title: "Perfil · Veloo" };

export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/perfil");
  const supabase = await supabaseServidor();
  const [{ data: c }, { data: ajustes }, { data: privado }, { count: links }, { data: lista }] = await Promise.all([
    supabase.from("creadoras").select("usuario, nombre, avatar_path, verificacion, mensajes_abiertos, suscripcion_tokens").eq("id", creadora.id).single(),
    supabase.from("ajustes_creadora").select("*").eq("creadora_id", creadora.id).maybeSingle(),
    supabase.from("creadoras_privado").select("rfc").eq("id", creadora.id).maybeSingle(),
    supabase.from("links_creadora").select("id", { count: "exact", head: true }).eq("creadora_id", creadora.id),
    supabase.from("mi_lista_aviso").select("correos").maybeSingle(),
  ]);
  if (!c?.usuario) redirect("/app/registro");

  return (
    <Perfil
      nombre={c.nombre || c.usuario}
      iniciales={iniciales(c.nombre || c.usuario)}
      avatar={urlAvatar(c.avatar_path)}
      usuario={c.usuario}
      verificacion={c.verificacion}
      rfc={privado?.rfc ?? null}
      paises={ajustes?.paises_bloqueados ?? []}
      links={links ?? 0}
      mensajesAbiertos={c.mensajes_abiertos}
      suscripcionTokens={c.suscripcion_tokens}
      listaAviso={lista?.correos ?? 0}
      sinLeer={await haySinLeer("creadora")}
      notificaciones={{
        notificar_ventas: ajustes?.notificar_ventas ?? true,
        notificar_retiros: ajustes?.notificar_retiros ?? true,
        notificar_moderacion: ajustes?.notificar_moderacion ?? true,
      }}
    />
  );
}

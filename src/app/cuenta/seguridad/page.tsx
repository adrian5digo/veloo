import { redirect } from "next/navigation";
import { supabaseServidor } from "@/server/supabase";
import { Seguridad } from "./seguridad";

export default async function Page() {
  const db = await supabaseServidor();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/entrar?siguiente=/cuenta/seguridad");
  const { data } = await db.from("usuarios_acceso").select("usuario").eq("id", user.id).maybeSingle();
  return <Seguridad usuario={data?.usuario ?? ""} />;
}

"use server";

import { revalidatePath } from "next/cache";
import { ID_MEDIO } from "@/lib/medios";
import { asegurarFan, fanActual } from "@/server/fan";
import { supabaseServidor } from "@/server/supabase";

type Resultado = { ok: true } | { ok: false; error: string; entrar?: boolean };

export async function seguir(creadoraId: string, siguiendo: boolean): Promise<Resultado> {
  const fan = await fanActual();
  if (!fan) return { ok: false, error: "Entra con tu correo para seguir.", entrar: true };
  if (!ID_MEDIO.test(creadoraId)) return { ok: false, error: "No encontramos a esa creadora." };
  await asegurarFan(fan.id);
  const supabase = await supabaseServidor();
  const { error } = siguiendo
    ? await supabase.from("seguimientos").upsert({ fan_id: fan.id, creadora_id: creadoraId }, { onConflict: "fan_id,creadora_id", ignoreDuplicates: true })
    : await supabase.from("seguimientos").delete().eq("fan_id", fan.id).eq("creadora_id", creadoraId);
  if (error) throw error;
  revalidatePath("/inicio");
  return { ok: true };
}

export async function meGusta(setId: string, gusta: boolean): Promise<Resultado> {
  const fan = await fanActual();
  if (!fan) return { ok: false, error: "Entra con tu correo para dar me gusta.", entrar: true };
  if (!ID_MEDIO.test(setId)) return { ok: false, error: "No encontramos ese set." };
  await asegurarFan(fan.id);
  const supabase = await supabaseServidor();
  const { error } = gusta
    ? await supabase.from("me_gusta").upsert({ fan_id: fan.id, set_id: setId }, { onConflict: "fan_id,set_id", ignoreDuplicates: true })
    : await supabase.from("me_gusta").delete().eq("fan_id", fan.id).eq("set_id", setId);
  if (error) throw error;
  return { ok: true };
}

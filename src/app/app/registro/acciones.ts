"use server";

import { redirect } from "next/navigation";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";

const USUARIO = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export type Disponibilidad = "disponible" | "ocupado" | "invalido";

/** Mismas reglas que usuario_permitido() en la base, más si ya lo tiene alguien. */
export async function revisarUsuario(usuario: string): Promise<Disponibilidad> {
  const creadora = await creadoraActual();
  if (!creadora) return "invalido";
  if (!USUARIO.test(usuario)) return "invalido";
  const db = supabaseAdmin();
  const [{ data: valido }, { data: otra }] = await Promise.all([
    db.rpc("usuario_permitido", { usuario }),
    db.from("creadoras").select("id").eq("usuario", usuario).neq("id", creadora.id).maybeSingle(),
  ]);
  if (!valido) return "invalido";
  return otra ? "ocupado" : "disponible";
}

function edad(nacimiento: Date, hoy = new Date()) {
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) anios--;
  return anios;
}

export async function registrar(datos: {
  usuario: string;
  dia: number;
  mes: number;
  anio: number;
  acepta: boolean;
}): Promise<{ error: string }> {
  const creadora = await creadoraActual();
  if (!creadora) return { error: "Tu sesión se cerró. Entra de nuevo con tu correo." };
  if (!datos.acepta) return { error: "Para seguir, acepta los términos y el aviso de privacidad." };

  const usuario = datos.usuario.trim().toLowerCase();
  const estado = await revisarUsuario(usuario);
  if (estado === "invalido") return { error: "Tu link usa de 3 a 30 letras minúsculas, números o guiones." };
  if (estado === "ocupado") return { error: "Ese link ya lo tiene alguien más. Prueba con otro." };

  const { dia, mes, anio } = datos;
  const nacimiento = new Date(anio, mes - 1, dia);
  if (nacimiento.getFullYear() !== anio || nacimiento.getMonth() !== mes - 1 || nacimiento.getDate() !== dia) {
    return { error: "Revisa la fecha de nacimiento: ese día no existe." };
  }
  const anios = edad(nacimiento);
  if (anios < 18) return { error: "Para vender en Veloo necesitas tener 18 años o más." };
  if (anios > 100) return { error: "Revisa el año de nacimiento." };

  const supabase = await supabaseServidor();
  const { error } = await supabase.from("creadoras").update({ usuario }).eq("id", creadora.id);
  if (error) {
    if (error.code === "23505") return { error: "Ese link ya lo tiene alguien más. Prueba con otro." };
    if (error.message.includes("usuario_cambiado_hace_poco")) {
      return { error: "Cambiaste tu link hace menos de 90 días. Podrás cambiarlo después." };
    }
    throw error;
  }

  // La fecha de nacimiento no la puede escribir la creadora: la verificación de la INE la compara.
  const iso = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const { error: e2 } = await supabaseAdmin()
    .from("creadoras_privado")
    .upsert({ id: creadora.id, fecha_nacimiento: iso }, { onConflict: "id" });
  if (e2) throw e2;

  redirect("/app/verificacion");
}

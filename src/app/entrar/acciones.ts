"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { destinoSeguro } from "@/lib/destino";
import { supabaseServidor } from "@/server/supabase";
import { errorContrasena, normalizarUsuario, USUARIO_ACCESO } from "@/lib/usuario-acceso";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_ACCESO = "No pudimos entrar con esos datos. Revisa tu usuario y contraseña. Si acabas de registrarte, confirma tu correo; también puedes entrar con un código.";

/** La función de Auth resuelve el correo en servidor; nunca se devuelve al navegador. */
export async function entrarConContrasena(identificador: string, contrasena: string, siguiente: string) {
  const usuario = normalizarUsuario(identificador);
  if (!USUARIO_ACCESO.test(usuario) || !contrasena || contrasena.length > 128) return { error: ERROR_ACCESO };
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.functions.invoke("entrar-usuario", { body: { usuario, contrasena } });
  if (error || !data?.access_token || !data?.refresh_token) return { error: ERROR_ACCESO };
  const { error: sesionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (sesionError) return { error: "No pudimos iniciar la sesión. Vuelve a intentar." };
  redirect(destinoSeguro(siguiente));
}

export async function crearConContrasena(datos: { usuario: string; correo: string; contrasena: string }, siguiente: string) {
  const usuario = normalizarUsuario(datos.usuario);
  const correo = datos.correo.trim().toLowerCase();
  if (!USUARIO_ACCESO.test(usuario)) return { error: "Tu usuario usa de 3 a 30 letras minúsculas, números, guiones o guiones bajos. Empieza y termina con letra o número." };
  if (!CORREO.test(correo)) return { error: "Revisa tu correo: le falta algo." };
  const errorClave = errorContrasena(datos.contrasena);
  if (errorClave) return { error: errorClave };
  const supabase = await supabaseServidor();
  // El origen se configura en el servidor y en la lista de redirects de Supabase.
  const origen = process.env.NEXT_PUBLIC_SITIO_URL || "http://localhost:3100";
  const { data, error } = await supabase.auth.signUp({ email: correo, password: datos.contrasena, options: {
    data: { usuario_acceso: usuario },
    emailRedirectTo: `${origen}/auth/confirmar?siguiente=${encodeURIComponent(destinoSeguro(siguiente))}`,
  } });
  if (error) return { error: error.status === 429 ? "Ya hiciste varios intentos. Espera un minuto y vuelve a intentar." : "No pudimos crear la cuenta con esos datos. Prueba otro usuario o entra con un código si ya tienes cuenta." };
  if (data.session) redirect(destinoSeguro(siguiente));
  return { correo };
}

/** Permite añadir contraseña a una cuenta que antes entraba solo con correo. */
export async function guardarAcceso(usuario: string, contrasena: string) {
  const limpio = normalizarUsuario(usuario);
  if (!USUARIO_ACCESO.test(limpio)) return { error: "Usa de 3 a 30 letras, números, guiones o guiones bajos." };
  const errorClave = errorContrasena(contrasena);
  if (errorClave) return { error: errorClave };
  const supabase = await supabaseServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión terminó. Entra otra vez con un código de correo." };
  const { error: reserva } = await supabase.rpc("asignar_usuario_acceso", { p_usuario: limpio });
  if (reserva) return { error: "Ese usuario no está disponible. Prueba con otro." };
  const { error } = await supabase.auth.updateUser({ password: contrasena });
  if (error) return { error: "Tu usuario quedó guardado, pero no pudimos cambiar la contraseña. Entra otra vez con un código reciente y vuelve a intentar." };
  return { ok: true };
}

export type ResultadoEnvio = { ok: true; correo: string } | { ok: false; error: string };

export async function mandarLink(correo: string, siguiente: string): Promise<ResultadoEnvio> {
  const limpio = correo.trim().toLowerCase();
  if (!CORREO.test(limpio)) return { ok: false, error: "Revisa el correo: le falta algo." };

  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITIO_URL ?? "";
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email: limpio,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origen}/auth/confirmar?siguiente=${encodeURIComponent(destinoSeguro(siguiente))}`,
    },
  });
  if (error) {
    return {
      ok: false,
      error:
        error.status === 429
          ? "Ya pediste varios links. Espera un minuto y vuelve a intentar."
          : "No pudimos mandar el link. Vuelve a intentar en un momento.",
    };
  }
  return { ok: true, correo: limpio };
}

export async function entrarConCodigo(correo: string, codigo: string, siguiente: string) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.verifyOtp({ email: correo, token: codigo, type: "email" });
  if (error) return { error: "Ese código no coincide o ya caducó. Revisa el correo más reciente." };
  redirect(destinoSeguro(siguiente));
}

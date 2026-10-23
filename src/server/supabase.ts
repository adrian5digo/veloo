import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { dominioCookies } from "@/lib/dominio";

function env(nombre: string) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return valor;
}

/** Cliente con la sesión del usuario: respeta RLS. Usar para todo lo que pueda. */
export async function supabaseServidor() {
  const almacenCookies = await cookies();
  return createServerClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    // Igual que en el proxy: la sesión se comparte con los subdominios de las creadoras.
    cookieOptions: { domain: dominioCookies() },
    cookies: {
      getAll: () => almacenCookies.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacenCookies.set(name, value, options);
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el proxy renueva la sesión.
        }
      },
    },
  });
}

let admin: SupabaseClient<Database> | null = null;

/**
 * Cliente con la secret key: se salta RLS. Solo para storage y para lo que el usuario
 * no puede hacer por sí mismo (procesar fotos). Verificar siempre la dueña antes de usarlo.
 */
export function supabaseAdmin() {
  admin ??= createClient<Database>(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

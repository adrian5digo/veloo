import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const responder = (datos: object, status = 200) => new Response(JSON.stringify(datos), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const denegado = () => responder({ error: "credenciales_invalidas" }, 401);

// Es un punto de entrada de Auth: verifica usuario y contraseña en el cuerpo,
// sin requerir una sesión previa. Nunca devuelve el correo ni la llave de servicio.
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return responder({ error: "metodo_no_permitido" }, 405);
  if (Number(req.headers.get("content-length")) > 2048) return denegado();
  const inicio = Date.now();
  try {
    const texto = await req.text();
    if (texto.length > 2048) return denegado();
    const body = JSON.parse(texto);
    const usuario = typeof body.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
    const contrasena = body.contrasena;
    if (!/^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/.test(usuario) || typeof contrasena !== "string" || !contrasena || contrasena.length > 128) return denegado();
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(usuario));
    const clave = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const { data: permitido, error: limiteError } = await admin.rpc("tomar_intento_acceso", { p_clave: clave });
    if (limiteError || !permitido) return denegado();
    const { data: acceso, error: accesoError } = await admin.from("usuarios_acceso").select("id").eq("usuario", usuario).maybeSingle();
    if (accesoError) return denegado();
    const cuenta = acceso ? await admin.auth.admin.getUserById(acceso.id) : null;
    const correo = cuenta?.data.user?.email ?? "cuenta-inexistente@invalid.veloo.vip";
    // Se usa un cliente separado para que la sesión autenticada no sustituya el rol del admin.
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await auth.auth.signInWithPassword({ email: correo, password: contrasena });
    // La respuesta inválida es la misma para nombres desconocidos, contraseñas erróneas y correo sin confirmar.
    if (error || !data.session || !acceso) {
      await new Promise((r) => setTimeout(r, Math.max(0, 550 - (Date.now() - inicio))));
      return denegado();
    }
    return responder({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return denegado();
  }
});

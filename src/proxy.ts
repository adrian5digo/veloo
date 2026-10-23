import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dominioCookies, RUTAS_APP, sitioPrincipal } from "@/lib/dominio";

const SUBDOMINIOS_PROPIOS = new Set(["www", "app", "api", "panel"]);

/** "valeruiz" si la petición llega a valeruiz.veloo.vip; null en el dominio principal o en desarrollo. */
function creadoraDelHost(request: NextRequest) {
  const dominio = process.env.NEXT_PUBLIC_DOMINIO;
  const host = request.headers.get("host")?.split(":")[0];
  if (!dominio || !host?.endsWith(`.${dominio}`)) return null;
  const usuario = host.slice(0, -dominio.length - 1);
  return /^[a-z0-9-]+$/.test(usuario) && !SUBDOMINIOS_PROPIOS.has(usuario) ? usuario : null;
}

/**
 * En un subdominio de creadora:
 * - valeruiz.veloo.vip/mazunte → reescribe a /u/valeruiz/mazunte (su perfil y sus sets).
 * - valeruiz.veloo.vip/l/…     → se sirve tal cual (botones de sus links).
 * - valeruiz.veloo.vip/tokens  → manda al dominio principal (entrar, tokens, mis compras…).
 */
function destinoDeSubdominio(request: NextRequest): { tipo: "reescribir" | "redirigir"; url: URL } | null {
  const usuario = creadoraDelHost(request);
  if (!usuario) return null;
  const { pathname, search } = request.nextUrl;
  // Los <Link> internos ya traen /u/[usuario]: no volver a anteponerlo.
  if (pathname.startsWith(`/u/${usuario}`)) return null;
  const primero = pathname.split("/")[1];
  if (primero === "l") return null;
  if (RUTAS_APP.has(primero)) {
    const sitio = sitioPrincipal();
    return sitio ? { tipo: "redirigir", url: new URL(`${pathname}${search}`, sitio) } : null;
  }
  const url = request.nextUrl.clone();
  url.pathname = `/u/${usuario}${pathname === "/" ? "" : pathname}`;
  return { tipo: "reescribir", url };
}

/** Renueva la sesión de Supabase en cada petición y protege la app de la creadora y el panel. */
export async function proxy(request: NextRequest) {
  const destino = destinoDeSubdominio(request);
  if (destino?.tipo === "redirigir") return NextResponse.redirect(destino.url);
  const reescribir = destino?.url;
  const continuar = () => (reescribir ? NextResponse.rewrite(reescribir, { request }) : NextResponse.next({ request }));

  let respuesta = continuar();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // La sesión vale en veloo.vip y en todos los subdominios: el fan entra una vez.
      cookieOptions: { domain: dominioCookies() },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = continuar();
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        },
      },
    },
  );

  // No meter código entre createServerClient y getUser: puede cerrar sesiones al azar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const privada = ["/app", "/panel", "/inicio", "/mis-compras", "/mensajes", "/ver"].some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (!user && privada) {
    const entrar = request.nextUrl.clone();
    entrar.pathname = "/entrar";
    entrar.search = `?siguiente=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(entrar);
  }

  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

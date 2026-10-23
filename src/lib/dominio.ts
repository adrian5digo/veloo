/**
 * Subdominios de creadora: [usuario].veloo.vip muestra su perfil (links + sets) y sus sets.
 * Todo lo demás (entrar, tokens, mis compras…) vive en el dominio principal.
 */

/**
 * Primer segmento de las rutas de la app. Misma lista que public.slug_reservado() (que además reserva
 * "suscripcion", ruta bajo el perfil): un set nunca se llama así.
 */
export const RUTAS_APP = new Set([
  "abrir",
  "acceso",
  "api",
  "app",
  "auth",
  "avisos",
  "baja",
  "cuenta",
  "entrar",
  "explorar",
  "guardar",
  "inicio",
  "l",
  "mensajes",
  "mis-compras",
  "orden",
  "panel",
  "privacidad",
  "reportar",
  "sistema",
  "terminos",
  "tokens",
  "u",
  "ver",
]);

/** Para compartir la sesión entre veloo.vip y los subdominios. Sin dominio (desarrollo), la cookie es del host. */
export function dominioCookies() {
  const d = process.env.NEXT_PUBLIC_DOMINIO;
  return d ? `.${d}` : undefined;
}

/** URL del sitio principal (para mandar ahí las rutas de la app que se abran en un subdominio). */
export function sitioPrincipal() {
  const d = process.env.NEXT_PUBLIC_DOMINIO;
  return process.env.NEXT_PUBLIC_SITIO_URL || (d ? `https://${d}` : "");
}

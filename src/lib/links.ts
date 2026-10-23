/**
 * Links públicos de la creadora.
 *
 * Con NEXT_PUBLIC_DOMINIO (ej. "veloo.vip") el perfil vive en un subdominio:
 *   valeruiz.veloo.vip            → /u/valeruiz
 *   valeruiz.veloo.vip/mazunte    → /u/valeruiz/mazunte
 * El proxy hace la reescritura. Sin dominio (desarrollo) se usa la ruta /u/... directa.
 */

const dominio = () => process.env.NEXT_PUBLIC_DOMINIO || null;

/** Lo que se muestra: "valeruiz.veloo.vip/mazunte". Sin dominio, la ruta local. */
export function linkVisible(usuario: string, slug?: string) {
  const d = dominio();
  if (d) return `${usuario}.${d}${slug ? `/${slug}` : ""}`;
  return `/u/${usuario}${slug ? `/${slug}` : ""}`;
}

/** URL completa para copiar y compartir. `origen` hace falta solo sin dominio (ej. window.location.origin). */
export function linkPublico(usuario: string, slug?: string, origen = "") {
  const d = dominio();
  if (d) return `https://${linkVisible(usuario, slug)}`;
  return `${origen}${linkVisible(usuario, slug)}`;
}

/** Ruta interna de la página pública, para <Link> dentro de la misma app. */
export function rutaPublica(usuario: string, slug?: string) {
  return `/u/${usuario}${slug ? `/${slug}` : ""}`;
}

/** "hace 5 min", "hace 1 h 40 min", "hace 3 días". */
export function hace(iso: string | null, ahora = Date.now()) {
  if (!iso) return "";
  const min = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 ? `hace ${h} h ${min % 60} min` : `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

/** Años cumplidos a partir de "1999-03-14". */
export function edadDe(fecha: string | null, hoy = new Date()) {
  if (!fecha) return null;
  const [a, m, d] = fecha.split("-").map(Number);
  let anios = hoy.getFullYear() - a;
  if (hoy.getMonth() + 1 < m || (hoy.getMonth() + 1 === m && hoy.getDate() < d)) anios--;
  return anios;
}

const ZONA = "America/Mexico_City";
const fechaCorta = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "numeric", month: "short" });
const hora = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const diaClave = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

/** "28 sep" (sin punto). */
export function fecha(iso: string) {
  return fechaCorta.format(new Date(iso)).replace(".", "");
}

/** "hoy 13:42", "ayer 09:10" o "28 sep 13:42", en hora del centro de México. */
export function horaCorta(iso: string, ahora = Date.now()) {
  const d = new Date(iso);
  const dia = diaClave.format(d);
  const prefijo = dia === diaClave.format(ahora) ? "hoy" : dia === diaClave.format(ahora - 24 * 3600_000) ? "ayer" : fecha(iso);
  return `${prefijo} ${hora.format(d)}`;
}

/** ISO de hace `n` días (para filtros de consultas). */
export function isoHaceDias(n: number) {
  return new Date(Date.now() - n * 24 * 3600_000).toISOString();
}

/** ¿Esa fecha ya pasó? */
export function yaPaso(iso: string | null) {
  return !!iso && new Date(iso).getTime() < Date.now();
}

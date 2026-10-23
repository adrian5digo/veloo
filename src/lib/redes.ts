import type { Database } from "@/lib/database.types";

export type Red = Database["public"]["Enums"]["red_link"];

/** Nombre que se propone como título al pegar el link. */
export const NOMBRE_RED: Record<Red, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  twitch: "Twitch",
  spotify: "Spotify",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  facebook: "Facebook",
  threads: "Threads",
  web: "Mi página",
};

const DOMINIOS: [Red, string[]][] = [
  ["instagram", ["instagram.com", "instagr.am"]],
  ["tiktok", ["tiktok.com"]],
  ["x", ["x.com", "twitter.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["twitch", ["twitch.tv"]],
  ["spotify", ["spotify.com"]],
  ["whatsapp", ["wa.me", "whatsapp.com"]],
  ["telegram", ["t.me", "telegram.me"]],
  ["facebook", ["facebook.com", "fb.com"]],
  ["threads", ["threads.net", "threads.com"]],
];

/**
 * "instagram.com/vale" → "https://instagram.com/vale". Acepta lo que pegan de la app (sin https, con
 * http, con mayúsculas en el dominio). null si no es un link web válido.
 */
export function normalizarUrl(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio || /\s/.test(limpio)) return null;
  const conEsquema = /^[a-z][a-z0-9+.-]*:/i.test(limpio) ? limpio : `https://${limpio}`;
  let url: URL;
  try {
    url = new URL(conEsquema);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(url.hostname) || url.username || url.password) return null;
  url.protocol = "https:";
  const final = url.toString();
  // Sin "/" final si el link no tenía ruta: "https://sitio.com" en vez de "https://sitio.com/".
  const salida = url.pathname === "/" && !url.search && !url.hash ? final.replace(/\/$/, "") : final;
  return salida.length <= 300 ? salida : null;
}

export function redDe(url: string): Red {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^(www|m|mobile)\./, "");
  } catch {
    return "web";
  }
  for (const [red, dominios] of DOMINIOS) if (dominios.some((d) => host === d || host.endsWith(`.${d}`))) return red;
  return "web";
}

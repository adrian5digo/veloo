import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { linkPublico } from "@/lib/links";
import { supabaseAdmin } from "./supabase";

/**
 * Correo transaccional con Resend. Cada aviso se manda después de responder (after()), así que un
 * correo que falla nunca rompe una compra ni un mensaje: solo queda en el log.
 *
 * Sin RESEND_API_KEY (desarrollo) no se manda nada; se escribe en la consola qué se habría mandado.
 */

const REMITENTE = () => process.env.CORREO_REMITENTE || "Veloo <hola@veloo.vip>";
const SITIO = () => process.env.NEXT_PUBLIC_SITIO_URL || "http://localhost:3100";

let cliente: Resend | null = null;
function resend() {
  const llave = process.env.RESEND_API_KEY;
  if (!llave) return null;
  cliente ??= new Resend(llave);
  return cliente;
}

type Correo = { para: string; asunto: string; html: string; texto: string; baja?: { pagina: string; unClic: string } };

/** Manda uno o varios correos (en lotes de 100). Nunca lanza: registra el error y sigue. */
export async function mandar(correos: Correo[]) {
  if (!correos.length) return;
  const r = resend();
  if (!r) {
    for (const c of correos) console.info(`[correo] sin RESEND_API_KEY, no se mandó "${c.asunto}" a ${c.para}`);
    return;
  }
  for (let i = 0; i < correos.length; i += 100) {
    const lote = correos.slice(i, i + 100).map((c) => ({
      from: REMITENTE(),
      to: c.para,
      subject: c.asunto,
      html: c.html,
      text: c.texto,
      // Gmail y Apple Mail muestran "Darse de baja" con esto (un clic, por POST).
      headers: c.baja ? { "List-Unsubscribe": `<${c.baja.unClic}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
    }));
    try {
      const { error } = await r.batch.send(lote);
      if (error) console.error("[correo] Resend rechazó el lote", error);
    } catch (e) {
      console.error("[correo] no se pudo mandar el lote", e);
    }
  }
}

// ───────────────────────── baja ─────────────────────────

function secreto() {
  const s = process.env.CORREO_SECRETO;
  if (!s) throw new Error("Falta CORREO_SECRETO (ver .env.example)");
  return s;
}

function firma(correo: string, creadoraId: string) {
  return createHmac("sha256", secreto()).update(`${correo}:${creadoraId}`).digest("base64url");
}

/**
 * Links para dejar de recibir avisos de una creadora. Firmados: nadie da de baja a otra persona.
 * `pagina` pide confirmar con un botón (los antivirus de correo abren los links); `unClic` es el
 * POST de List-Unsubscribe que manda Gmail.
 */
export function linkBaja(correo: string, creadoraId: string) {
  const q = new URLSearchParams({ e: correo, c: creadoraId, t: firma(correo, creadoraId) });
  return { pagina: `${SITIO()}/baja?${q}`, unClic: `${SITIO()}/api/baja?${q}` };
}

export function bajaValida(correo: string, creadoraId: string, token: string) {
  const esperado = Buffer.from(firma(correo, creadoraId));
  const recibido = Buffer.from(token);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

// ───────────────────────── plantilla ─────────────────────────

const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Correo con la marca: fondo rosa claro, título en ciruela, un solo botón.
 * Los colores van en hex porque los clientes de correo no leen variables CSS (mismos valores que --bg, --text, --accent-ink…).
 */
function plantilla({ titulo, parrafos, boton, pie }: { titulo: string; parrafos: string[]; boton?: { texto: string; url: string }; pie: string }) {
  const p = parrafos.map((x) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#3b1d34">${escapar(x)}</p>`).join("");
  const b = boton
    ? `<a href="${escapar(boton.url)}" style="display:inline-block;margin:8px 0 4px;padding:15px 28px;border-radius:999px;background:#c42a74;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">${escapar(boton.texto)}</a>`
    : "";
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#fff7fa;font-family:Nunito,Helvetica,Arial,sans-serif">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<div style="font-size:20px;font-weight:700;color:#3b1d34;margin-bottom:24px">veloo</div>
<div style="background:#ffffff;border:1px solid #f0cfe0;border-radius:24px;padding:28px 24px">
<h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#3b1d34">${escapar(titulo)}</h1>${p}${b}
</div>
<p style="margin:20px 8px 0;font-size:12px;line-height:1.5;color:#75596a">${pie}</p>
</div></body></html>`;
  const texto = [titulo, "", ...parrafos, ...(boton ? ["", `${boton.texto}: ${boton.url}`] : [])].join("\n");
  return { html, texto };
}

const pieBaja = (url: string) => `Te escribimos porque pediste que te avisáramos. <a href="${escapar(url)}" style="color:#75596a">Ya no quiero estos avisos</a>.`;

// ───────────────────────── avisos ─────────────────────────

/** Set publicado: a su lista de aviso y a sus seguidores, una sola vez por set. */
export async function avisarSetNuevo(setId: string) {
  const db = supabaseAdmin();
  const { data: dest, error } = await db.rpc("tomar_aviso_set", { p_set: setId });
  if (error) return console.error("[correo] tomar_aviso_set", error);
  if (!dest?.length) return;
  const { data: set } = await db.from("sets").select("titulo, slug, creadora_id, creadoras(usuario, nombre)").eq("id", setId).single();
  if (!set?.creadoras?.usuario) return;
  const nombre = set.creadoras.nombre || set.creadoras.usuario;
  const url = linkPublico(set.creadoras.usuario, set.slug, SITIO());

  await mandar(
    dest.map(({ destinatario }) => {
      const baja = linkBaja(destinatario, set.creadora_id);
      const { html, texto } = plantilla({
        titulo: `${nombre} publicó un set nuevo`,
        parrafos: [`Se llama “${set.titulo}”. Lo ves con velo y su precio antes de decidir.`],
        boton: { texto: "Ver el set", url },
        pie: pieBaja(baja.pagina),
      });
      return { para: destinatario, asunto: `${nombre} publicó “${set.titulo}”`, html, texto: `${texto}\n\nDarte de baja: ${baja}`, baja };
    }),
  );
}

/** Mensaje nuevo en una conversación. Máximo un correo cada 3 h por lado. */
export async function avisarMensaje(conversacionId: string, para: "fan" | "creadora") {
  const { data, error } = await supabaseAdmin().rpc("tomar_aviso_mensaje", { p_conversacion: conversacionId, p_para: para });
  if (error) return console.error("[correo] tomar_aviso_mensaje", error);
  const d = data?.[0];
  if (!d) return;
  const url = `${SITIO()}${para === "fan" ? "/mensajes" : "/app/mensajes"}/${conversacionId}`;
  const { html, texto } = plantilla({
    titulo: `${d.de} te escribió`,
    parrafos: ["Tienes un mensaje nuevo en Veloo. Por seguridad no lo copiamos aquí: entra para leerlo y contestar."],
    boton: { texto: "Leer el mensaje", url },
    pie: "Te escribimos porque tienes una conversación en Veloo. Si llegan más mensajes, te avisamos máximo cada 3 horas.",
  });
  await mandar([{ para: d.destinatario, asunto: `${d.de} te escribió en Veloo`, html, texto }]);
}

/** C14: un set mandado a un grupo. Un correo por fan que lo recibió (mismo límite de 3 h). */
export async function avisarEnvio(creadoraId: string, setId: string, desde: string) {
  const db = supabaseAdmin();
  const { data: dest, error } = await db.rpc("tomar_avisos_envio", { p_creadora: creadoraId, p_set: setId, p_desde: desde });
  if (error) return console.error("[correo] tomar_avisos_envio", error);
  if (!dest?.length) return;
  const { data: c } = await db.from("creadoras").select("usuario, nombre").eq("id", creadoraId).single();
  const nombre = c?.nombre || c?.usuario || "Una creadora";

  await mandar(
    dest.map(({ destinatario, conversacion }) => {
      const baja = linkBaja(destinatario, creadoraId);
      const { html, texto } = plantilla({
        titulo: `${nombre} te mandó un set`,
        parrafos: ["Está en tus mensajes, con velo y su precio. Si ya lo tenías o tienes su suscripción, lo ves completo."],
        boton: { texto: "Verlo", url: `${SITIO()}/mensajes/${conversacion}` },
        pie: pieBaja(baja.pagina),
      });
      return { para: destinatario, asunto: `${nombre} te mandó un set en Veloo`, html, texto: `${texto}\n\nDarte de baja: ${baja}`, baja };
    }),
  );
}

/** F4: set desbloqueado con tokens. Lleva el link permanente (/acceso/[token]), ligado a su correo. */
export async function avisarDesbloqueo(correo: string, titulo: string, token: string) {
  const { html, texto } = plantilla({
    titulo: `“${titulo}” ya es tuyo`,
    parrafos: [
      "Este link es tu acceso permanente al set. Guárdalo: funciona aunque cierres sesión.",
      "Las fotos llevan una marca de agua con tu correo. Son para verlas tú: no se comparten.",
    ],
    boton: { texto: "Ver mi set", url: `${SITIO()}/acceso/${token}` },
    pie: "Recibiste este correo porque desbloqueaste un set en Veloo con esta cuenta.",
  });
  await mandar([{ para: correo, asunto: `“${titulo}” ya es tuyo · Veloo`, html, texto }]);
}

/** Webhook de Stripe: se acreditaron los tokens (tarjeta al momento; OXXO cuando se paga en tienda). */
export async function avisarTokens(compraId: string) {
  const db = supabaseAdmin();
  const { data: compra } = await db.from("compras_tokens").select("tokens, fan_id").eq("id", compraId).single();
  if (!compra) return;
  const { data: u } = await db.auth.admin.getUserById(compra.fan_id);
  if (!u.user?.email) return;
  const { html, texto } = plantilla({
    titulo: `Se sumaron ${compra.tokens} tokens`,
    parrafos: ["Ya están en tu saldo. Úsalos para desbloquear sets o suscribirte. No vencen."],
    boton: { texto: "Ver mis tokens", url: `${SITIO()}/tokens` },
    pie: "Recibiste este correo porque compraste tokens en Veloo.",
  });
  await mandar([{ para: u.user.email, asunto: `Se sumaron ${compra.tokens} tokens · Veloo`, html, texto }]);
}

/** Cron: la renovación se detuvo porque no alcanzaron los tokens. */
export async function avisarSuscripcionDetenida(fanId: string, creadoraId: string, tokens: number) {
  const db = supabaseAdmin();
  const [{ data: u }, { data: c }] = await Promise.all([
    db.auth.admin.getUserById(fanId),
    db.from("creadoras").select("usuario, nombre").eq("id", creadoraId).single(),
  ]);
  if (!u.user?.email || !c?.usuario) return;
  const nombre = c.nombre || c.usuario;
  const { html, texto } = plantilla({
    titulo: `Tu suscripción a ${nombre} se detuvo`,
    parrafos: [
      `Para renovarla hacían falta ${tokens} tokens y no te alcanzaron. No se te cobró nada.`,
      "Si compras tokens, puedes volver a suscribirte desde su página cuando quieras.",
    ],
    boton: { texto: "Volver a suscribirme", url: `${linkPublico(c.usuario, undefined, SITIO())}/suscripcion` },
    pie: "Recibiste este correo porque tenías una suscripción activa en Veloo.",
  });
  await mandar([{ para: u.user.email, asunto: `Tu suscripción a ${nombre} se detuvo · Veloo`, html, texto }]);
}

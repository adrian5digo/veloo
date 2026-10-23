/**
 * Plantillas de historia de Instagram (H1–H4): 1080×1920, con portada ya velada por el servidor.
 * Se dibujan en un canvas para que la vista previa y la imagen guardada sean la misma.
 * Estas paletas son los únicos hex permitidos fuera de los tokens.
 */

export type Estilo = { nombre: string; fondo: string; tinta: string; tintaAvatar: string; acento: string };

export const ESTILOS: Estilo[] = [
  { nombre: "Chicle", fondo: "#f0388a", tinta: "#ffffff", tintaAvatar: "#6b3fc0", acento: "rgba(255,255,255,.85)" },
  { nombre: "Crema", fondo: "#fff0f6", tinta: "#3b1d34", tintaAvatar: "#fff0f6", acento: "#f7609f" },
  { nombre: "Ciruela", fondo: "#3b1d34", tinta: "#fff7fa", tintaAvatar: "#3b1d34", acento: "#ff8dba" },
  { nombre: "Rosa", fondo: "#7a2c8f", tinta: "#fff7fa", tintaAvatar: "#7a2c8f", acento: "rgba(255,247,250,.85)" },
];

export type DatosHistoria = { iniciales: string; usuario: string; detalle: string; portada?: string };

export const ANCHO = 1080;
export const ALTO = 1920;
const MARGEN = 96;

/** Familia de Fredoka que cargó next/font (el nombre real lleva un hash). */
function familiaDisplay() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-fredoka").trim();
  return v || "sans-serif";
}

function lineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number) {
  const palabras = texto.split(" ");
  const salida: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      salida.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) salida.push(actual);
  return salida;
}

export async function dibujarHistoria(canvas: HTMLCanvasElement, estilo: Estilo, datos: DatosHistoria) {
  const familia = familiaDisplay();
  await Promise.all(["500 44px", "600 150px"].map((f) => document.fonts.load(`${f} ${familia}`)));
  const portada = datos.portada ? await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la portada"));
    img.src = datos.portada!;
  }) : null;

  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const fuente = (peso: number, px: number) => `${peso} ${px}px ${familia}`;

  ctx.fillStyle = estilo.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.textBaseline = "top";

  // Avatar con iniciales + @usuario (top 300).
  ctx.fillStyle = estilo.tinta;
  ctx.beginPath();
  ctx.arc(MARGEN + 38, 300 + 38, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = estilo.tintaAvatar;
  ctx.font = fuente(600, 30);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(datos.iniciales, MARGEN + 38, 300 + 40);
  ctx.textAlign = "left";
  ctx.fillStyle = estilo.tinta;
  ctx.font = fuente(500, 44);
  ctx.fillText(`@${datos.usuario}`, MARGEN + 76 + 20, 300 + 40);
  ctx.textBaseline = "top";

  // Kicker y título sobre la portada.
  let y = 450;
  ctx.fillStyle = estilo.acento;
  ctx.font = fuente(600, 36);
  ctx.fillText("Recién subido", MARGEN, y);
  y += 36 + 28;

  ctx.fillStyle = estilo.tinta;
  ctx.font = fuente(600, 108);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "-6px";
  for (const l of lineas(ctx, "Nuevo set disponible", ANCHO - MARGEN * 2)) {
    ctx.fillText(l, MARGEN, y);
    y += 108;
  }
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  // La imagen ya tiene velo irreversible; nunca se carga el original en el navegador.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(MARGEN, 760, ANCHO - MARGEN * 2, 550, 44);
  ctx.clip();
  if (portada) {
    const escala = Math.max(888 / portada.width, 550 / portada.height);
    const w = portada.width * escala, h = portada.height * escala;
    ctx.drawImage(portada, MARGEN + (888 - w) / 2, 760 + (550 - h) / 2, w, h);
  } else {
    ctx.fillStyle = estilo.acento;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(MARGEN, 760, 888, 550);
  }
  ctx.restore();
  // Candado dibujado, sin glifos de texto que dependan de una fuente de iconos.
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath(); ctx.arc(540, 1035, 62, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 7; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(540, 1025, 19, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(511, 1025, 58, 44, 10); ctx.stroke();
  ctx.font = fuente(500, 44);
  ctx.fillStyle = estilo.tinta;
  ctx.fillText(datos.detalle, MARGEN, 1350);

  // Recuadro del sticker de enlace.
  ctx.strokeStyle = estilo.acento;
  ctx.lineWidth = 6;
  ctx.setLineDash([26, 18]);
  ctx.beginPath();
  ctx.roundRect(MARGEN, 1460, ANCHO - MARGEN * 2, 170, 32);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = estilo.tinta;
  ctx.font = fuente(500, 36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Pega aquí el sticker Enlace", ANCHO / 2, 1460 + 85);

  // Marca, fuera de los 250px inferiores.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 0.7;
  ctx.font = fuente(600, 40);
  ctx.fillText("veloo", MARGEN, ALTO - 290);
  ctx.globalAlpha = 1;
}

export function pngDe(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error("canvas vacío"))), "image/png"));
}

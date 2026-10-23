// Genera los íconos de la PWA (P4): candado Phosphor bold claro sobre ciruela, sin texto.
// Uso: node scripts/iconos-pwa.mjs
import sharp from "sharp";

const CANDADO =
  "M208,76H180V56A52,52,0,0,0,76,56V76H48A20,20,0,0,0,28,96V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V96A20,20,0,0,0,208,76ZM100,56a28,28,0,0,1,56,0V76H100ZM204,204H52V100H204Zm-60-52a16,16,0,1,1-16-16A16,16,0,0,1,144,152Z";
const CIRUELA = "#3b1d34"; // --text en modo claro
const CREMA = "#fff7fa"; // --bg en modo claro

function svg(lado, escala) {
  // El candado (256×256) ocupa `escala` del lado; los íconos "maskable" necesitan margen.
  const s = (lado * escala) / 256;
  const o = (lado - 256 * s) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="100%" height="100%" fill="${CIRUELA}"/>` +
      `<path d="${CANDADO}" fill="${CREMA}" transform="translate(${o},${o}) scale(${s})"/></svg>`,
  );
}

const salida = [
  ["public/icono-192.png", 192, 0.5],
  ["public/icono-512.png", 512, 0.5],
  ["public/icono-maskable-512.png", 512, 0.38],
  ["public/apple-touch-icon.png", 180, 0.5],
];
for (const [ruta, lado, escala] of salida) await sharp(svg(lado, escala)).png().toFile(ruta);
console.log("Íconos listos:", salida.map(([r]) => r).join(", "));

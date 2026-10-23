import type { MetadataRoute } from "next";

/** P4: en la pantalla de inicio se llama "Bóveda" y el ícono es un candado neutro. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bóveda",
    short_name: "Bóveda",
    description: "Tus fotos y compras guardadas.",
    start_url: "/abrir",
    scope: "/",
    display: "standalone",
    background_color: "#3b1d34",
    theme_color: "#3b1d34",
    lang: "es-MX",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

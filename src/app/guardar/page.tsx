import type { Metadata } from "next";
import { headers } from "next/headers";
import { destinoSeguro } from "@/lib/destino";
import { Guardar } from "./guardar";

export const metadata: Metadata = { title: "Guárdalo en tu teléfono · Veloo", robots: { index: false } };

/** P1 / P2: solo aparece después de comprar o al crear cuenta. */
export default async function Page({ searchParams }: PageProps<"/guardar">) {
  const { siguiente } = await searchParams;
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  return (
    <Guardar
      siguiente={destinoSeguro(siguiente, "/mis-compras")}
      host={h.get("host") ?? ""}
      instagram={/Instagram|FBAN|FBAV/i.test(ua)}
      plataforma={/Android/i.test(ua) ? "android" : "ios"}
    />
  );
}

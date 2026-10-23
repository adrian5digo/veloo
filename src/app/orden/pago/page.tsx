import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Boton } from "@/components/ui";
import { hashToken } from "@/server/pagos";
import { confirmarSesionDirecta } from "@/server/pago-directo";
import { stripe } from "@/server/stripe";

export const metadata: Metadata = { title: "Tu pago · Veloo", robots: { index: false }, referrer: "no-referrer" };

export default async function Page({ searchParams }: PageProps<"/orden/pago">) {
  const { session_id: id } = await searchParams;
  let destino: string | null = null;
  let reintentar = false;
  if (typeof id === "string" && /^cs_(test|live)_[a-zA-Z0-9]+$/.test(id)) {
    try {
      const sesion = await stripe().checkout.sessions.retrieve(id);
      const token = (await cookies()).get(`veloo_pago_${sesion.metadata?.orden_id}`)?.value;
      // Poseer el ID público de una orden o una sesión no basta para abrir el contenido.
      if (token && /^[A-Za-z0-9_-]{43}$/.test(token) && hashToken(token) === sesion.metadata?.acceso_hash) {
        const confirmada = await confirmarSesionDirecta(sesion);
        if (confirmada) destino = `/acceso/${token}?directo=1`;
        else reintentar = sesion.status !== "expired";
      }
    } catch {
      reintentar = true;
    }
  }
  if (destino) redirect(destino);
  return <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-5 px-6"><h1 className="m-0 font-display text-[30px] font-semibold">{reintentar ? "Estamos comprobando tu pago" : "Vuelve a tus compras"}</h1><p className="m-0 text-sm leading-relaxed text-muted">{reintentar ? "Todavía no pudimos confirmar el acceso. Si ya pagaste, no repitas el cargo: vuelve a comprobar en unos segundos." : "Abre este regreso en el navegador donde empezaste el pago. También puedes entrar con el correo de tu compra para encontrarla."}</p>{reintentar && <Boton href={`/orden/pago?session_id=${encodeURIComponent(String(id))}`}>Comprobar de nuevo</Boton>}<Boton variante="secundario" href="/mis-compras">Mis compras</Boton></main>;
}

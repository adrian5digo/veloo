"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton } from "@/components/ui";
import { destinoSeguro } from "@/lib/destino";
import { guardarSuscripcion } from "./acciones";

function claveBytes(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const bin = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/**
 * P3 · Permiso de avisos con pantalla propia antes del permiso del sistema:
 * si dicen "no" al del sistema, ya no se puede volver a pedir.
 */
export function Avisos({ siguiente, ejemplo }: { siguiente: string; ejemplo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [ocupado, setOcupado] = useState(false);
  const destino = destinoSeguro(siguiente, "/inicio");

  async function activar() {
    setError(undefined);
    const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return setError("Este navegador no permite avisos. En iPhone, primero agrega veloo a tu inicio.");
    }
    if (!clave) return setError("Los avisos todavía no están disponibles. Te contamos cuando lo estén.");
    setOcupado(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setError("No diste permiso. Puedes activarlo después en los ajustes del navegador.");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const sub = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveBytes(clave) });
      const json = sub.toJSON();
      const r = await guardarSuscripcion({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" });
      if (r.error) return setError(r.error);
      router.push(destino);
    } catch {
      setError("No se pudieron activar los avisos. Vuelve a intentar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg px-7">
      {/* Así se ve un aviso: sin fotos ni precios. */}
      <div aria-hidden className="mt-[130px] flex -rotate-1 flex-col gap-2.5 rounded-[22px] border border-line bg-surface p-3.5 shadow-frame">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="size-[18px] rounded-[5px] bg-text" />
          Bóveda · ahora
        </div>
        <div className="text-[15px] font-semibold">{ejemplo}</div>
        <div className="text-sm text-muted">Toca para verlo</div>
      </div>
      <h1 className="m-0 mt-9 font-display text-[26px] leading-[1.15] font-semibold tracking-[-0.01em]">¿Te avisamos cuando suban algo?</h1>
      <p className="m-0 mt-2.5 text-[15px] leading-normal text-pretty text-muted">
        Solo de las creadoras que sigues. Las notificaciones nunca muestran fotos ni precios.
      </p>
      <div className="mt-auto flex flex-col gap-2.5 pt-8 pb-7">
        {error && <p className="m-0 text-center text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={activar} disabled={ocupado}>
          {ocupado ? "Activando…" : "Activar avisos"}
        </Boton>
        <Boton variante="texto" tono="apagado" href={destino} className="font-medium">
          Ahora no
        </Boton>
      </div>
    </main>
  );
}

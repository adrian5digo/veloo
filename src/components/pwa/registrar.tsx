"use client";

import { useEffect } from "react";

/** Registra el service worker (P2 instalar, P3 avisos). */
export function RegistrarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

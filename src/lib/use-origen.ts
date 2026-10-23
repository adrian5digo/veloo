"use client";

import { useSyncExternalStore } from "react";

const nada = () => () => {};

/** window.location.origin en el navegador; "" al renderizar en el servidor. */
export function useOrigen() {
  return useSyncExternalStore(nada, () => window.location.origin, () => "");
}

"use server";

import { redirect } from "next/navigation";
import { ID_MEDIO } from "@/lib/medios";
import { confirmarOrden, pagosSimulados } from "@/server/pagos";

/** Solo desarrollo: hace lo que haría el webhook del procesador al confirmarse un OXXO / SPEI. */
export async function simularPago(ordenId: string) {
  if (!pagosSimulados() || !ID_MEDIO.test(ordenId)) return;
  const token = await confirmarOrden(ordenId);
  redirect(token ? `/acceso/${token}?nuevo=1` : "/mis-compras");
}

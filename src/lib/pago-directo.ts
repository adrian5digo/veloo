/** Comprobaciones compartidas del webhook y del regreso de Stripe. Nunca acepta datos del navegador como prueba de pago. */
export function sesionDirectaValida(
  sesion: { id: string; livemode: boolean; currency: string | null; amount_total: number | null; metadata: Record<string, string> | null; customer_email: string | null; payment_status: string },
  orden: { id: string; procesador: string; procesador_ref: string | null; precio_centavos: number; correo: string },
  enVivo = false,
) {
  return sesion.payment_status === "paid" && sesion.livemode === enVivo && orden.procesador === "stripe_directo" && orden.procesador_ref === sesion.id
    && sesion.metadata?.orden_id === orden.id && sesion.metadata?.tipo === "set_directo"
    && sesion.metadata?.mayor_edad === "si" && /^[a-f0-9]{64}$/.test(sesion.metadata?.acceso_hash ?? "")
    && sesion.currency === "mxn" && sesion.amount_total === orden.precio_centavos
    && sesion.customer_email?.toLowerCase() === orden.correo;
}

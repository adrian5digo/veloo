"use client";

import { useState, useTransition } from "react";
import { CaretLeftIcon, CreditCardIcon, LockIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Boton, Campo, Velo, ZonaCTA } from "@/components/ui";
import { CasillaEdad } from "@/components/fan/casilla-edad";
import { precioMXN } from "@/lib/dinero";
import { pagarDirecto } from "./directo-acciones";

export function PagoDirecto({ setId, titulo, creadora, monto, portada, volver, correoInicial, cancelado }: { setId: string; titulo: string; creadora: string; monto: number; portada: string | null; volver: string; correoInicial: string; cancelado: boolean }) {
  const [correo, setCorreo] = useState(correoInicial);
  const [edad, setEdad] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();
  return <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
    <header className="flex items-center gap-3 px-5 py-4"><Link href={volver} aria-label="Volver al set" className="grid size-11 place-items-center text-text!"><CaretLeftIcon size={20} weight="bold" /></Link><span className="font-semibold">Tu compra</span></header>
    <section className="px-6 pt-3"><p className="m-0 text-[13px] font-bold text-accent-ink">Un pago, este set es tuyo</p><h1 className="mt-3 mb-2 font-display text-[32px] leading-tight font-semibold">Un paso y estás dentro</h1><p className="m-0 text-sm leading-relaxed text-muted">Paga con tarjeta. Sin crear cuenta ni recargar saldo.</p></section>
    <div className="mx-5 mt-6 flex items-center gap-4 border-y border-line py-5">{portada ? <Velo fuente={{ src: portada }} className="h-24 w-24 shrink-0" /> : <span className="grid size-24 shrink-0 place-items-center rounded-[22px] bg-surface-2 text-muted"><LockIcon size={28} weight="bold" /></span>}<div className="min-w-0"><h2 className="m-0 truncate text-base font-bold">{titulo}</h2><p className="mt-1 mb-2 text-sm text-muted">De {creadora}</p><span className="text-xs text-muted">Acceso permanente</span></div></div>
    <form className="flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); setError(undefined); iniciar(async () => { const r = await pagarDirecto(setId, correo, edad); if (!r.ok) return setError(r.error); window.location.assign(r.ir); }); }}>
      <Campo className="px-5 pt-6" label="Tu correo" type="email" autoComplete="email" required maxLength={254} value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
      <p className="mx-5 mt-2 text-xs text-muted">Tu compra queda ligada a este correo.</p>
      <div className="px-5 pt-3"><CasillaEdad marcada={edad} onChange={setEdad} /></div>
      <div className="mx-5 mt-5 flex items-baseline justify-between border-t border-line pt-5"><span className="text-sm text-muted">Total</span><strong className="font-display text-[32px] font-semibold">{precioMXN(monto)}</strong></div>
      <ZonaCTA>{cancelado && <p className="m-0 text-sm text-muted">Saliste de Stripe sin terminar. Puedes volver a intentarlo.</p>}{error && <p role="alert" className="m-0 text-sm text-bad">{error}</p>}<Boton type="submit" disabled={ocupado || !edad} icono={<CreditCardIcon size={20} weight="bold" />}>{ocupado ? "Abriendo Stripe…" : `Pagar ${precioMXN(monto)}`}</Boton><p className="m-0 text-center text-xs text-muted">Pago de prueba con Stripe. No se cobra dinero real.</p></ZonaCTA>
    </form>
  </main>;
}

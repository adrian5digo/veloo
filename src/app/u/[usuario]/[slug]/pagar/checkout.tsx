"use client";

import { BankIcon, CaretLeftIcon, CreditCardIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Boton, Campo, OpcionGrande, Velo, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Database } from "@/lib/database.types";
import { precio, precioMXN, totalMXN } from "@/lib/dinero";
import { pagar } from "./acciones";

type Metodo = Exclude<Database["public"]["Enums"]["metodo_pago"], "tokens">;

const METODOS: { valor: Metodo; label: string; icono: typeof CreditCardIcon }[] = [
  { valor: "tarjeta", label: "Tarjeta", icono: CreditCardIcon },
  { valor: "oxxo", label: "OXXO", icono: StorefrontIcon },
  { valor: "spei", label: "SPEI", icono: BankIcon },
];

/** F4 · Checkout, y E2 si el banco rechaza la tarjeta. */
export function Checkout({
  setId,
  titulo,
  detalle,
  creadora,
  monto,
  portada,
  volver,
  correoInicial,
  simulado,
  metodos,
  speiManual,
}: {
  setId: string;
  titulo: string;
  detalle: string;
  creadora: string;
  monto: number;
  portada: string | null;
  volver: string;
  correoInicial: string;
  /** Pagos de prueba (solo desarrollo). */
  simulado: boolean;
  /** Los que ofrece el procesador activo. */
  metodos: Metodo[];
  /** Transferencia que el equipo confirma a mano: tarda más que un SPEI con procesador. */
  speiManual: boolean;
}) {
  const router = useRouter();
  const [correo, setCorreo] = useState(correoInicial);
  const [metodo, setMetodo] = useState<Metodo>(metodos[0] ?? "tarjeta");
  const opciones = METODOS.filter((m) => metodos.includes(m.valor));
  const [tarjeta, setTarjeta] = useState("");
  const [rechazada, setRechazada] = useState(false);
  const [error, setError] = useState<string>();
  const [pagando, iniciar] = useTransition();

  function cobrar(m: Metodo) {
    setError(undefined);
    iniciar(async () => {
      // Simulador: la tarjeta de prueba 4000 0000 0000 0002 se rechaza. El número nunca sale del navegador.
      const tokenTarjeta = m === "tarjeta" ? (tarjeta.replace(/\D/g, "") === "4000000000000002" ? "rechazar" : "tok_simulado") : undefined;
      const r = await pagar({ setId, correo, metodo: m, tokenTarjeta });
      if (r.ok) return router.push(r.ir);
      if (r.rechazada) {
        setRechazada(true);
        setMetodo("oxxo");
      } else setError(r.error);
    });
  }

  if (rechazada) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
        <header className="flex items-center gap-2.5 px-[18px] py-2 text-base font-bold">
          <button type="button" onClick={() => setRechazada(false)} aria-label="Regresar" className="-ml-2.5 grid size-11 cursor-pointer place-items-center">
            <CaretLeftIcon weight="bold" size={20} />
          </button>
          Pagar
        </header>
        <section className="flex flex-col gap-2.5 px-6 pt-5">
          <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">Tu banco no aprobó el cargo</h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            No se cobró nada. Pasa seguido con tarjetas de débito en compras en línea: puedes activarlas desde la app de tu banco o pagar en efectivo.
          </p>
        </section>
        <div role="radiogroup" aria-label="Otra forma de pago" className="flex flex-col gap-2 px-5 pt-[22px]">
          {(["oxxo", "spei"] as const).map((m) => (
            <OpcionGrande key={m} seleccionada={metodo === m} onSelect={() => setMetodo(m)} className="min-h-16 justify-start px-[18px] text-left">
              <span className="flex items-center gap-3.5">
                {m === "oxxo" ? <StorefrontIcon weight="bold" size={22} /> : <BankIcon weight="bold" size={22} />}
                <span>
                  <b className="block text-[15px]">{m === "oxxo" ? "Pagar en OXXO" : "Transferir por SPEI"}</b>
                  <span className="text-[13px] font-medium text-muted">{m === "oxxo" ? "En efectivo, sin tarjeta" : "Desde la app de tu banco"}</span>
                </span>
              </span>
            </OpcionGrande>
          ))}
        </div>
        <ZonaCTA>
          {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
          <Boton onClick={() => cobrar(metodo)} disabled={pagando}>
            {pagando ? "Generando…" : metodo === "oxxo" ? "Generar ficha OXXO" : "Ver datos para transferir"}
          </Boton>
          <Boton
            variante="texto"
            onClick={() => {
              setRechazada(false);
              setMetodo("tarjeta");
              setTarjeta("");
            }}
          >
            Probar con otra tarjeta
          </Boton>
        </ZonaCTA>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-[18px] py-2 text-[15px] font-semibold">
        <Link href={volver} aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        Pagar
      </header>

      <div className="mx-5 mt-1 flex items-center gap-3 rounded-[22px] border border-line bg-surface p-3">
        {portada ? <Velo fuente={{ src: portada }} className="size-12 flex-none rounded-[12px]" /> : <div className="size-12 rounded-[12px] bg-surface-2" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">
            {titulo} · {detalle}
          </div>
          <div className="text-[13px] text-muted">{creadora}</div>
        </div>
        <div className="font-display text-base font-semibold">{precio(monto)}</div>
      </div>

      <Campo
        label="Correo para recibir el acceso"
        className="px-5 pt-[22px]"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />

      {opciones.length > 1 && (
        <div className="flex flex-col gap-2 px-5 pt-5">
          <span className="text-[13px] font-semibold">Método de pago</span>
          <div role="radiogroup" aria-label="Método de pago" className={cn("grid gap-2", opciones.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {opciones.map(({ valor, label, icono: Icono }) => (
              <OpcionGrande key={valor} seleccionada={metodo === valor} onSelect={() => setMetodo(valor)} className="min-h-16 flex-col gap-1 text-sm">
                <span className="flex flex-col items-center gap-1">
                  <Icono weight="bold" size={20} />
                  {label}
                </span>
              </OpcionGrande>
            ))}
          </div>
        </div>
      )}

      {metodo === "tarjeta" &&
        (simulado ? (
          <div className="flex flex-col gap-2 px-5 pt-4">
            <Campo
              label="Tarjeta de prueba"
              mono
              inputMode="numeric"
              autoComplete="off"
              placeholder="4242 4242 4242 4242"
              value={tarjeta}
              onChange={(e) => setTarjeta(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
              ayuda="Modo de prueba: no escribas una tarjeta real. 4000 0000 0000 0002 simula un rechazo."
            />
          </div>
        ) : (
          <p className="m-0 px-5 pt-4 text-sm leading-normal text-muted">Tu banco puede pedirte confirmar el pago.</p>
        ))}
      {metodo === "oxxo" && (
        <p className="m-0 px-5 pt-4 text-sm leading-normal text-pretty text-muted">
          Te damos una referencia para pagar en efectivo en cualquier OXXO. Tienes 72 horas. El acceso llega a tu correo cuando se confirme (normalmente en
          menos de 1 hora).
        </p>
      )}
      {metodo === "spei" &&
        (speiManual ? (
          <div className="flex flex-col gap-1.5 px-5 pt-5">
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <BankIcon weight="bold" size={20} />
              Transferencia SPEI
            </span>
            <p className="m-0 text-sm leading-normal text-pretty text-muted">
              Te damos la CLABE y un concepto que es solo tuyo. Lo escribes al transferir desde la app de tu banco y así sabemos que el pago es tuyo. Lo
              confirmamos en unas horas.
            </p>
          </div>
        ) : (
          <p className="m-0 px-5 pt-4 text-sm leading-normal text-pretty text-muted">
            Te damos una CLABE para transferir desde tu app del banco. Se confirma en minutos y te enviamos el acceso por correo.
          </p>
        ))}

      <ZonaCTA className="gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Total</span>
          <span className="font-semibold">{totalMXN(monto)}</span>
        </div>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={() => cobrar(metodo)} disabled={pagando || !correo.includes("@")}>
          {pagando
            ? "Un momento…"
            : metodo === "tarjeta"
              ? `Pagar ${precioMXN(monto)}`
              : metodo === "oxxo"
                ? "Generar ficha OXXO"
                : "Ver datos para transferir"}
        </Boton>
        {metodo === "tarjeta" && (
          <p className="m-0 text-center text-xs text-muted">
            En tu estado de cuenta aparece como <span className="font-mono">VLO*DIGITAL</span>
          </p>
        )}
      </ZonaCTA>
    </main>
  );
}

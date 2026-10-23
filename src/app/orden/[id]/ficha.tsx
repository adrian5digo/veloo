"use client";

import { ClockIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Boton, Estado, ZonaCTA } from "@/components/ui";
import { totalMXN } from "@/lib/dinero";

type Props = {
  metodo: "oxxo" | "spei";
  monto: number;
  correo: string;
  referencia: string;
  clabe: string | null;
  venceEn: string;
  volver: string;
  /** SPEI manual: transferencia a la cuenta de Veloo, con concepto único, que el equipo confirma a mano. */
  manual?: { banco: string; titular: string };
  /** Botón de prueba (solo desarrollo). */
  simular?: () => Promise<void>;
};

const limite = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "930012845567 0912" → grupos de 4 para leerlo en caja. */
const enGrupos = (s: string) => s.replace(/(.{4})/g, "$1 ").trim();

/** F5 · Ficha OXXO y F6 · Datos SPEI. Mientras espera, revisa el pago cada minuto. */
export function Ficha({ metodo, monto, correo, referencia, clabe, venceEn, volver, manual, simular }: Props) {
  const router = useRouter();
  const [copiado, setCopiado] = useState<"clabe" | "concepto">();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(t);
  }, [router]);

  async function copiar(que: "clabe" | "concepto") {
    try {
      await navigator.clipboard.writeText(que === "clabe" ? (clabe ?? "") : referencia);
      setCopiado(que);
    } catch {
      // Sin portapapeles: el dato sigue visible.
    }
  }

  async function guardarFicha() {
    const familia = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "monospace";
    const c = document.createElement("canvas");
    c.width = 1080;
    c.height = 1350;
    const ctx = c.getContext("2d")!;
    const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    ctx.fillStyle = css("--surface") || "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = css("--text") || "#000";
    ctx.textBaseline = "top";
    ctx.font = `600 64px ${getComputedStyle(document.documentElement).getPropertyValue("--font-fredoka").trim() || "sans-serif"}`;
    ctx.fillText("Paga en cualquier OXXO", 90, 120);
    ctx.font = `500 40px ${familia}`;
    ctx.fillText("Monto a pagar", 90, 300);
    ctx.font = `600 96px ${familia}`;
    ctx.fillText(totalMXN(monto), 90, 360);
    ctx.font = `500 40px ${familia}`;
    ctx.fillText("Referencia", 90, 560);
    ctx.font = `500 76px ${familia}`;
    ctx.fillText(enGrupos(referencia), 90, 620);
    ctx.font = `500 40px ${familia}`;
    ctx.fillText(`Fecha límite: ${limite.format(new Date(venceEn))}`, 90, 800);
    ctx.fillText("Di en caja que es un pago de servicio.", 90, 880);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `ficha-oxxo-${referencia.slice(-4)}.png`;
    a.click();
  }

  const fila = "flex items-center gap-2.5 border-b border-line px-[18px] py-4";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <section className="flex flex-col gap-2 px-6 pt-7">
        <Estado tono="warn">Esperando pago</Estado>
        <h1 className="m-0 font-display text-[26px] leading-[1.15] font-semibold tracking-[-0.01em]">
          {metodo === "oxxo" ? "Paga en cualquier OXXO" : "Transfiere desde tu banco"}
        </h1>
        <p className="m-0 text-sm leading-normal text-pretty text-muted">
          {metodo === "oxxo"
            ? "Muestra esta ficha en caja y di que es un pago de servicio."
            : manual
              ? "Escribe el concepto tal cual en tu transferencia. Es solo para esta compra: así sabemos que el pago es tuyo."
              : "Usa estos datos exactos. Esta CLABE es solo para esta compra."}
        </p>
      </section>

      {metodo === "oxxo" ? (
        <div className="mx-5 mt-5 flex flex-col gap-[18px] rounded-[26px] border border-line bg-surface px-5 py-[22px]">
          <div>
            <div className="text-xs text-muted">Monto a pagar</div>
            <div className="font-display text-4xl font-semibold tracking-[-0.01em]">
              {totalMXN(monto).replace(" MXN", "")} <span className="text-base font-medium text-muted">MXN</span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted">Referencia</div>
            <div className="font-mono text-xl tracking-[.06em]">{enGrupos(referencia)}</div>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted">Fecha límite</span>
            <span className="font-semibold">{limite.format(new Date(venceEn))}</span>
          </div>
        </div>
      ) : (
        <div className="mx-5 mt-5 flex flex-col rounded-[26px] border border-line bg-surface">
          <div className={fila}>
            <div className="flex-1">
              <div className="text-xs text-muted">CLABE</div>
              <div className="font-mono text-[17px] tracking-[.03em]">{enGrupos(clabe ?? "")}</div>
            </div>
            <button
              type="button"
              onClick={() => copiar("clabe")}
              className="grid min-h-11 cursor-pointer place-items-center px-1.5 text-sm font-semibold text-accent-ink"
            >
              {copiado === "clabe" ? "Copiada" : "Copiar"}
            </button>
          </div>
          {manual ? (
            <>
              <div className={`${fila} bg-accent-soft`}>
                <div className="flex-1">
                  <div className="text-xs text-muted">Concepto (escríbelo tal cual)</div>
                  <div className="font-mono text-[22px] font-medium tracking-[.08em]">{referencia}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copiar("concepto")}
                  className="grid min-h-11 cursor-pointer place-items-center px-1.5 text-sm font-semibold text-accent-ink"
                >
                  {copiado === "concepto" ? "Copiado" : "Copiar"}
                </button>
              </div>
              <div className={`${fila} justify-between gap-4`}>
                <div className="min-w-0">
                  <div className="text-xs text-muted">Titular</div>
                  <div className="truncate text-[15px] font-medium">{manual.titular}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Banco</div>
                  <div className="text-[15px] font-medium">{manual.banco}</div>
                </div>
              </div>
            </>
          ) : (
            <div className={`${fila} justify-between`}>
              <div>
                <div className="text-xs text-muted">Referencia</div>
                <div className="font-mono text-[17px]">{referencia}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">Banco</div>
                <div className="text-[15px] font-medium">STP</div>
              </div>
            </div>
          )}
          <div className="flex items-baseline justify-between px-[18px] py-4">
            <div className="text-xs text-muted">Monto exacto</div>
            <div className="text-[22px] font-semibold">{totalMXN(monto)}</div>
          </div>
        </div>
      )}

      {metodo === "oxxo" ? (
        <p className="m-0 mx-5 mt-4 flex items-start gap-2.5 text-sm leading-[1.45] text-pretty text-muted">
          <EnvelopeSimpleIcon weight="bold" size={18} className="mt-px flex-none" />
          Te enviaremos el acceso a {correo} cuando se confirme el pago.
        </p>
      ) : manual ? (
        <p className="m-0 mx-5 mt-4 flex items-start gap-2.5 text-sm leading-[1.45] text-pretty text-muted">
          <ClockIcon weight="bold" size={18} className="mt-px flex-none" />
          Revisamos cada transferencia a mano, normalmente en unas horas. Puedes cerrar esta página: cuando se confirme, entra a Mis compras con {correo}.
          Tienes hasta el {limite.format(new Date(venceEn))}.
        </p>
      ) : (
        <div className="mx-5 mt-[18px] flex items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3.5 text-sm">
          <span aria-hidden className="size-[18px] flex-none animate-spin rounded-full border-2 border-line border-t-accent" />
          <span className="leading-[1.4]">Revisando cada minuto. Puedes cerrar esta página: el acceso llega a tu correo.</span>
        </div>
      )}

      <ZonaCTA>
        {simular && (
          <form action={simular}>
            <Boton type="submit" variante="texto" tono="apagado" className="w-full">
              Simular que se pagó (solo desarrollo)
            </Boton>
          </form>
        )}
        {metodo === "oxxo" ? (
          <Boton onClick={guardarFicha}>Guardar ficha en fotos</Boton>
        ) : (
          <Boton variante="secundario" href={volver} className="font-medium">
            Cambiar método de pago
          </Boton>
        )}
      </ZonaCTA>
    </main>
  );
}

import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { BarraLegal } from "@/components/legal/barra";

export const metadata: Metadata = { title: "Términos de uso · Veloo" };

// Texto de muestra del diseño (R2). Falta la revisión legal en México antes de lanzar.
const SECCIONES = [
  {
    titulo: "Quién puede usar Veloo",
    texto:
      "Veloo es solo para mayores de 18 años: para vender, comprar sets o tokens, suscribirte o escribir mensajes. En compras con cuenta, la confirmación queda en tu cuenta; en pago directo sin cuenta, queda registrada en la sesión de pago. Las creadoras verifican su identidad antes de publicar. Si sospechamos que alguien es menor de edad, suspendemos la cuenta mientras lo revisamos.",
  },
  {
    titulo: "Verificación y consentimiento",
    texto:
      "Cada persona que aparece en un set firma su consentimiento para ese set, con su identificación. Si retira su consentimiento, el set deja de verse de inmediato.",
  },
  {
    titulo: "Compras y reembolsos",
    texto:
      "Pagas una vez y el acceso es permanente, ligado a tu correo. Lo que compras es para verlo tú: no lo puedes compartir, revender ni publicar en otro lado. Si un cargo no se completó, no se te cobra.",
  },
  {
    titulo: "Suscripciones",
    texto:
      "Con una suscripción ves todos los sets de esa creadora mientras siga activa. Se paga con tokens al empezar y se renueva cada mes con tu saldo; si no te alcanza, se detiene sin cobrarte nada más. Puedes cancelar cuando quieras y sigues viendo todo hasta la fecha que ya pagaste. Lo que ves por suscripción no queda en tus compras cuando termina.",
  },
  {
    titulo: "Mensajes",
    texto:
      "Puedes escribirle a una creadora si ya le compraste o estás suscrito. Solo texto, máximo 20 mensajes al día. Nada de acoso, contenido sexual ni pedir o compartir datos personales. Cualquiera de los dos puede reportar la conversación (solo así la lee el equipo) y la creadora puede bloquearte.",
  },
  {
    titulo: "Contenido que no se permite",
    texto:
      "Nada de desnudos ni contenido sexual, aunque vaya con velo. Nada con menores de edad, nada sin consentimiento de quien aparece, nada robado de otra persona, ni datos personales visibles (direcciones, placas, documentos). Los sets pasan por moderación; durante el piloto, la cuenta de pruebas autorizada puede publicar sin revisión previa.",
  },
  {
    titulo: "Comisión y retiros",
    texto:
      "Veloo cobra 20% de cada venta, procesamiento incluido. El saldo de cada venta se libera 7 días después por posibles contracargos. El retiro mínimo es de $200 y cambiar la CLABE pausa los retiros 24 horas.",
  },
  {
    titulo: "Reportes y retiro de contenido",
    texto:
      "Cualquiera puede reportar sin cuenta. Los reportes de contenido sin consentimiento o de posible menor ocultan el set al momento y se revisan en menos de 1 hora.",
  },
];

/** R2 · Términos de uso. */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <BarraLegal ruta="terminos" />
      <div className="flex flex-col gap-1.5 px-6 pt-6">
        <h1 className="m-0 font-display text-[28px] font-semibold">Términos de uso</h1>
        <p className="m-0 text-[13px] text-muted">Vigentes desde el 1 de octubre de 2026</p>
      </div>
      <section className="mx-5 mt-[18px] flex flex-col gap-2 rounded-[22px] bg-surface-2 px-[18px] py-4 text-sm leading-[1.45]">
        <h2 className="m-0 text-sm font-bold">En corto</h2>
        <p className="m-0">Nada de desnudos ni contenido sexual. Durante el piloto hay publicación directa para la cuenta de pruebas autorizada.</p>
        <p className="m-0">Cada persona que aparece firmó su consentimiento.</p>
        <p className="m-0">Si compras, es tuyo para verlo, no para compartirlo.</p>
      </section>
      <div className="flex flex-col px-5 pt-[18px]">
        {SECCIONES.map((s, i) => (
          <details key={s.titulo} className="group border-b border-line">
            <summary className="flex min-h-13 cursor-pointer list-none items-center gap-3 text-[15px] [&::-webkit-details-marker]:hidden">
              <span className="w-5 font-mono text-xs text-accent-ink">{i + 1}</span>
              <span className="flex-1">{s.titulo}</span>
              <CaretRightIcon weight="bold" size={18} className="text-muted transition-transform group-open:rotate-90" />
            </summary>
            <p className="m-0 pb-4 pl-8 text-sm leading-normal text-muted">{s.texto}</p>
          </details>
        ))}
      </div>
      <nav className="mt-auto flex justify-center gap-4 px-6 pt-4 pb-6 text-[13px]">
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/reportar">Reportar</Link>
        <a href="mailto:hola@veloo.vip">Contacto</a>
      </nav>
    </main>
  );
}

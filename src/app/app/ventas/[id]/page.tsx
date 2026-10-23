import { BankIcon, CoinsIcon, CreditCardIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Encabezado } from "@/components/creadora/encabezado";
import { Estado, FilaLista, Velo, ZonaCTA, type Tono } from "@/components/ui";
import { cifra, totalMXN } from "@/lib/dinero";
import { ID_MEDIO, urlVelo } from "@/lib/medios";
import { cuantasFotos } from "@/lib/texto";
import { fecha, horaCorta, yaPaso } from "@/lib/tiempo";
import { creadoraActual } from "@/server/sesion";
import { supabaseAdmin, supabaseServidor } from "@/server/supabase";
import { Bloqueo } from "./bloqueo";

export const metadata: Metadata = { title: "Venta · Veloo" };

const METODO = {
  tarjeta: { icono: CreditCardIcon, label: "Tarjeta" },
  oxxo: { icono: StorefrontIcon, label: "OXXO" },
  spei: { icono: BankIcon, label: "SPEI" },
  tokens: { icono: CoinsIcon, label: "Tokens" },
} as const;

/** C11 · Detalle de venta. El correo del fan siempre va enmascarado. */
export default async function Page({ params }: PageProps<"/app/ventas/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const creadora = await creadoraActual();
  if (!creadora) redirect(`/entrar?siguiente=/app/ventas/${id}`);
  const supabase = await supabaseServidor();
  const { data: v, error } = await supabase.from("mis_ventas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!v) notFound();

  const [{ data: set }, { count }, bloqueo] = await Promise.all([
    supabase.from("sets").select("portada_id").eq("id", v.set_id!).maybeSingle(),
    supabase.from("medios").select("id", { count: "exact", head: true }).eq("set_id", v.set_id!),
    bloqueadoEnOrden(creadora.id, id),
  ]);

  const precio = v.precio_centavos! / 100;
  const comision = v.comision_centavos! / 100;
  const neto = v.neto_centavos! / 100;
  const retenida = v.estado === "pagada" && !yaPaso(v.disponible_en!);
  const estado: { tono: Tono; label: string } =
    v.estado === "contracargo"
      ? { tono: "bad", label: "Contracargo: se descontó" }
      : v.estado === "reembolsada"
        ? { tono: "bad", label: "Reembolsada" }
        : retenida
          ? { tono: "warn", label: `Retenido hasta ${fecha(v.disponible_en!)}` }
          : { tono: "ok", label: "Disponible" };
  const { icono: IconoMetodo, label: metodo } = METODO[v.metodo!];
  const fila = "flex justify-between border-b border-line py-3 text-[15px]";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/ventas" titulo="Venta" derecha={<span className="font-mono text-xs text-muted">VT-{v.folio}</span>} />

      <section className="flex flex-wrap items-end gap-x-3 gap-y-1 px-6 pt-1.5">
        <div>
          <div className="text-[13px] text-muted">Recibes</div>
          <div className="font-display text-[40px] leading-none font-semibold">{cifra(neto)}</div>
        </div>
        <Estado tono={estado.tono} className="mb-1.5">
          {estado.label}
        </Estado>
      </section>

      <FilaLista
        className="mx-5 mt-[22px]"
        miniatura={set?.portada_id ? <Velo fuente={{ src: urlVelo(set.portada_id, "mini") }} className="size-16" /> : <div className="size-16 rounded-[14px] bg-surface-2" />}
        titulo={v.titulo}
        meta={`${cuantasFotos(count ?? 0)} · ${horaCorta(v.pagada_en!)}`}
      />

      <dl className="m-0 flex flex-col px-5 pt-5">
        <div className={fila}>
          <dt>Precio</dt>
          <dd className="m-0">{totalMXN(precio)}</dd>
        </div>
        <div className={fila}>
          <dt>Comisión Veloo (20%)</dt>
          <dd className="m-0">−{cifra(comision)}</dd>
        </div>
        <div className={`${fila} font-bold`}>
          <dt>Neto</dt>
          <dd className="m-0">{cifra(neto)}</dd>
        </div>
        <div className={fila}>
          <dt>Método</dt>
          <dd className="m-0 flex items-center gap-1.5">
            <IconoMetodo weight="bold" size={18} />
            {metodo}
          </dd>
        </div>
        <div className="flex justify-between py-3 text-[15px]">
          <dt>Fan</dt>
          <dd className="m-0 font-mono text-[13px] text-muted">{v.correo}</dd>
        </div>
      </dl>
      <p className="m-0 px-5 pt-2.5 text-[13px] leading-normal text-pretty text-muted">
        Nunca ves el correo completo del fan. Los pagos se liberan 7 días después para cubrir posibles contracargos.
      </p>

      <ZonaCTA>
        <Bloqueo ordenId={id} bloqueado={bloqueo} />
      </ZonaCTA>
    </main>
  );
}

/** El correo enmascarado puede repetirse entre fans: se revisa con el correo real, en el servidor. */
async function bloqueadoEnOrden(creadoraId: string, ordenId: string) {
  const db = supabaseAdmin();
  const { data: o } = await db.from("ordenes").select("correo").eq("id", ordenId).eq("creadora_id", creadoraId).maybeSingle();
  if (!o) return false;
  const { data } = await db.rpc("esta_bloqueado", { p_creadora: creadoraId, p_correo: o.correo });
  return !!data;
}

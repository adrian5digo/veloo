import { CheckIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boton, FilaLista, Velo, ZonaCTA } from "@/components/ui";
import { precio } from "@/lib/dinero";
import { rutaPublica } from "@/lib/links";
import { ID_MEDIO, urlVelo } from "@/lib/medios";
import { fecha, yaPaso } from "@/lib/tiempo";
import { cuentaSpeiManual, pagosSimulados } from "@/server/pagos";
import { supabaseAdmin } from "@/server/supabase";
import { simularPago } from "./acciones";
import { Ficha } from "./ficha";

export const metadata: Metadata = { title: "Tu pago · Veloo", robots: { index: false } };

/**
 * F5 / F6 · Esperando pago, o E3 si la ficha venció.
 * El id de la orden es un UUID que solo conoce quien compró; aquí no se muestra nada del contenido.
 */
export default async function Page({ params }: PageProps<"/orden/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const db = supabaseAdmin();
  const { data: o } = await db
    .from("ordenes")
    .select(
      "id, metodo, estado, correo, procesador, precio_centavos, oxxo_referencia, spei_clabe, spei_referencia, vence_en, sets(titulo, slug, estado, portada_id), creadoras(usuario, nombre)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!o || o.metodo === "tarjeta" || o.metodo === "tokens" || !o.sets || !o.creadoras?.usuario) notFound();

  const volver = rutaPublica(o.creadoras.usuario, o.sets.slug);
  const vencida = o.estado === "vencida" || (o.estado === "pendiente" && yaPaso(o.vence_en));
  const manual = o.procesador === "spei_manual";

  if (o.estado === "pagada") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg px-6">
        <span className="mt-[120px] grid size-14 place-items-center rounded-full bg-ok-soft text-ok">
          <CheckIcon weight="bold" size={26} />
        </span>
        <h1 className="m-0 mt-6 font-display text-[28px] leading-[1.15] font-semibold">Recibimos tu pago</h1>
        <p className="m-0 mt-3 text-[15px] leading-normal text-pretty text-muted">
          {o.sets.titulo} ya es tuyo. Lo ves en Mis compras entrando con {o.correo}.
        </p>
        <ZonaCTA className="px-0">
          <Boton href="/mis-compras">Ver mis compras</Boton>
        </ZonaCTA>
      </main>
    );
  }

  if (vencida || o.estado !== "pendiente") {
    const disponible = o.sets.estado === "publicado";
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
        <section className="flex flex-col gap-2.5 px-6 pt-10">
          <span className="flex items-center gap-2 text-sm font-bold text-muted">
            <ClockIcon weight="bold" size={16} />
            {o.vence_en ? `Venció el ${fecha(o.vence_en)}` : "Ya no está activa"}
          </span>
          <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">
            {o.metodo === "oxxo" ? "Esta ficha ya no sirve" : manual ? "Este concepto ya no sirve" : "Esta CLABE ya no sirve"}
          </h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            {manual
              ? `Si no transferiste, no pasa nada. Si sí transferiste con el concepto ${o.spei_referencia}, tampoco se pierde: lo revisamos y te damos el acceso en Mis compras.`
              : "Si no pagaste, no pasa nada. Si sí pagaste después de la fecha, el dinero regresa solo a tu correo en forma de reembolso en 5 días hábiles."}
          </p>
        </section>
        <FilaLista
          className="mx-5 mt-6"
          miniatura={o.sets.portada_id ? <Velo fuente={{ src: urlVelo(o.sets.portada_id, "mini") }} className="size-16" /> : undefined}
          titulo={o.sets.titulo}
          meta={`${o.creadoras.nombre || o.creadoras.usuario} · ${disponible ? "sigue disponible" : "ya no está disponible"}`}
          derecha={precio(o.precio_centavos / 100)}
        />
        {disponible && (
          <ZonaCTA>
            <Boton href={`${volver}/pagar`}>
              {o.metodo === "oxxo" ? "Sacar una ficha nueva" : manual ? "Pedir un concepto nuevo" : "Pedir una CLABE nueva"}
            </Boton>
          </ZonaCTA>
        )}
      </main>
    );
  }

  const cuenta = manual ? cuentaSpeiManual() : null;
  const banco = cuenta ? (await db.from("bancos").select("nombre").eq("codigo", cuenta.clabe.slice(0, 3)).maybeSingle()).data?.nombre : null;

  return (
    <Ficha
      metodo={o.metodo}
      monto={o.precio_centavos / 100}
      correo={o.correo}
      referencia={(o.metodo === "oxxo" ? o.oxxo_referencia : o.spei_referencia) ?? ""}
      clabe={o.spei_clabe}
      venceEn={o.vence_en!}
      volver={`${volver}/pagar`}
      manual={cuenta ? { titular: cuenta.titular, banco: banco ?? "SPEI" } : undefined}
      simular={pagosSimulados() ? simularPago.bind(null, o.id) : undefined}
    />
  );
}

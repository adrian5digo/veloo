"use client";

import { CaretRightIcon, CheckIcon, ClockIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState } from "react";
import { Avatar, BarraCreadora, Boton, DatoCopiable, FilaToggle, ZonaCTA } from "@/components/ui";
import type { Database } from "@/lib/database.types";
import { linkPublico, linkVisible } from "@/lib/links";
import { useOrigen } from "@/lib/use-origen";
import { cerrarSesion, guardarMensajesAbiertos, guardarNotificacion } from "./acciones";
import { CabeceraCreadora } from "@/components/creadora/cabecera";

type Campo = "notificar_ventas" | "notificar_retiros" | "notificar_moderacion";

const NOTIFICACIONES: { campo: Campo; label: string; detalle: string }[] = [
  { campo: "notificar_ventas", label: "Cada venta", detalle: "Push con el monto" },
  { campo: "notificar_moderacion", label: "Resultado de moderación", detalle: "Aprobado o rechazado" },
  { campo: "notificar_retiros", label: "Retiros", detalle: "Cuando el dinero llega a tu banco" },
];

const VERIFICACION: Record<Database["public"]["Enums"]["estado_verificacion"], { icono: typeof CheckIcon; clase: string; label: string }> = {
  aprobada: { icono: CheckIcon, clase: "text-ok", label: "Identidad verificada" },
  en_revision: { icono: ClockIcon, clase: "text-warn", label: "Revisando tu identidad" },
  pendiente: { icono: ClockIcon, clase: "text-warn", label: "Falta verificar tu identidad" },
  rechazada: { icono: XIcon, clase: "text-bad", label: "No pudimos verificarte" },
};

/** C8 · Perfil de la creadora. */
export function Perfil({
  nombre,
  iniciales,
  avatar,
  usuario,
  verificacion,
  rfc,
  paises,
  links,
  mensajesAbiertos,
  suscripcionTokens,
  listaAviso,
  notificaciones,
  sinLeer,
}: {
  nombre: string;
  iniciales: string;
  avatar?: string;
  usuario: string;
  verificacion: Database["public"]["Enums"]["estado_verificacion"];
  rfc: string | null;
  paises: string[];
  links: number;
  mensajesAbiertos: boolean;
  suscripcionTokens: number | null;
  /** Correos que esperan su próximo set (F1 · Avísame). */
  listaAviso: number;
  notificaciones: Record<Campo, boolean>;
  sinLeer?: boolean;
}) {
  const [valores, setValores] = useState(notificaciones);
  const [abiertos, setAbiertos] = useState(mensajesAbiertos);
  const [error, setError] = useState<string>();
  const origen = useOrigen();
  const v = VERIFICACION[verificacion];

  async function cambiar(campo: Campo, valor: boolean) {
    setValores((x) => ({ ...x, [campo]: valor }));
    setError(undefined);
    const r = await guardarNotificacion(campo, valor);
    if (!r.ok) {
      setValores((x) => ({ ...x, [campo]: !valor }));
      setError(r.error);
    }
  }

  async function cambiarMensajes(valor: boolean) {
    setAbiertos(valor);
    setError(undefined);
    const r = await guardarMensajesAbiertos(valor);
    if (!r.ok) {
      setAbiertos(!valor);
      setError(r.error);
    }
  }

  const fila = "flex min-h-13 items-center justify-between border-b border-line text-[15px] text-text! no-underline";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <CabeceraCreadora titulo="Tu perfil" detalle="Dale tu toque a tu página y decide cómo conectar con tus fans." />

      <section className="flex items-center gap-3.5 px-5 pt-[18px]">
        <Avatar iniciales={iniciales} src={avatar} tamano={64} />
        <div className="flex-1">
          <div className="text-[17px] font-semibold">{nombre}</div>
          {verificacion === "aprobada" ? (
            <span className={`flex items-center gap-1 text-[13px] font-medium ${v.clase}`}>
              <v.icono weight="bold" size={14} />
              {v.label}
            </span>
          ) : (
            <Link href="/app/verificacion" className={`flex items-center gap-1 text-[13px] font-medium no-underline ${v.clase}`}>
              <v.icono weight="bold" size={14} />
              {v.label}
            </Link>
          )}
        </div>
        <Boton variante="texto" href="/app/perfil/editar" className="font-medium">
          Editar
        </Boton>
      </section>

      <DatoCopiable valor={linkPublico(usuario, undefined, origen)} mostrar={linkVisible(usuario)} className="px-5 pt-[18px]" />
      <div className="px-5 pt-3"><Link href="/cuenta/seguridad" className={fila}><span>Usuario y contraseña</span><CaretRightIcon weight="bold" size={18} /></Link></div>

      <section className="flex flex-col px-5 pt-[22px]">
        <h2 className="m-0 mb-1 text-[13px] font-semibold">Fans</h2>
        <div className="flex min-h-14 items-center border-b border-line">
          <div className="flex-1">
            <FilaToggle
              titulo="Mensajes de fans"
              detalle="Solo quienes ya te compraron o están suscritos"
              activo={abiertos}
              onChange={cambiarMensajes}
            />
          </div>
        </div>
        <Link href="/app/perfil/suscripcion" className={fila}>
          <span>Suscripción mensual</span>
          <span className="flex items-center gap-1 text-[13px] text-muted">
            {suscripcionTokens ? `${suscripcionTokens} tokens al mes` : "Apagada"}
            <CaretRightIcon weight="bold" size={18} />
          </span>
        </Link>
        <div className={fila}>
          <span>Esperan tu próximo set</span>
          <span className="pr-1 text-[13px] text-muted">{listaAviso === 1 ? "1 correo" : `${listaAviso} correos`}</span>
        </div>
      </section>

      <section className="flex flex-col px-5 pt-[22px]">
        <h2 className="m-0 mb-1 text-[13px] font-semibold">Notificaciones</h2>
        {NOTIFICACIONES.map((n) => (
          <div key={n.campo} className="flex min-h-14 items-center border-b border-line">
            <div className="flex-1">
              <FilaToggle titulo={n.label} detalle={n.detalle} activo={valores[n.campo]} onChange={(x) => cambiar(n.campo, x)} />
            </div>
          </div>
        ))}
        {error && <p className="m-0 pt-2 text-[13px] font-semibold text-bad">{error}</p>}
      </section>

      <nav className="flex flex-col px-5 pt-[22px]">
        <Link href="/app/perfil/links" className={fila}>
          <span>Mis links</span>
          <span className="flex items-center gap-1 text-[13px] text-muted">
            {links === 0 ? "Agrega tus redes" : links === 1 ? "1 link" : `${links} links`}
            <CaretRightIcon weight="bold" size={18} />
          </span>
        </Link>
        <Link href="/app/perfil/fiscales" className={fila}>
          <span>Datos fiscales (RFC)</span>
          <span className="flex items-center gap-1 text-[13px] text-muted">
            {rfc ? <span className="font-mono">{rfc}</span> : "Sin capturar"}
            <CaretRightIcon weight="bold" size={18} />
          </span>
        </Link>
        <Link href="/app/perfil/paises" className={fila}>
          <span>Bloquear países</span>
          <span className="flex items-center gap-1 text-[13px] text-muted">
            {paises.length === 0 ? "Ninguno" : paises.length === 1 ? "1 país" : `${paises.length} países`}
            <CaretRightIcon weight="bold" size={18} />
          </span>
        </Link>
        <a href="mailto:hola@veloo.vip" className={`${fila} border-b-0`}>
          <span>Ayuda</span>
          <CaretRightIcon weight="bold" size={18} className="text-muted" />
        </a>
      </nav>

      <ZonaCTA>
        <form action={cerrarSesion}>
          <Boton type="submit" variante="secundario" className="font-medium text-bad!">
            Cerrar sesión
          </Boton>
        </form>
      </ZonaCTA>

      <div className="sticky bottom-0">
        <BarraCreadora activa="perfil" sinLeer={sinLeer} />
      </div>
    </main>
  );
}

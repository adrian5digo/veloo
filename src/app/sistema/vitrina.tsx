"use client";

import { BankIcon, CreditCardIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, type ReactNode } from "react";
import {
  AreaTexto,
  Avatar,
  BarraCreadora,
  BarraFan,
  Boton,
  Campo,
  Chips,
  DatoCopiable,
  Estado,
  EstadoDeItem,
  EtiquetaPantalla,
  FilaLista,
  FilaToggle,
  Logo,
  MarcaDeAgua,
  MarcoMovil,
  Miniatura,
  OpcionGrande,
  PildoraEstado,
  Segmentado,
  TituloPantalla,
  Toggle,
  Velo,
  VeloRevelable,
  ZonaCTA,
} from "@/components/ui";
import { netoCreadora, precio, precioMXN } from "@/lib/dinero";

type Filtro = "todo" | "borradores" | "moderacion" | "publicados" | "rechazados";
type Periodo = "hoy" | "semana" | "mes";
type Metodo = "tarjeta" | "oxxo" | "spei";

export function Vitrina() {
  const [tema, setTema] = useState<"claro" | "oscuro">("claro");
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [sugerido, setSugerido] = useState("149");
  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [metodo, setMetodo] = useState<Metodo>("oxxo");
  const [ventas, setVentas] = useState(true);
  const [retiros, setRetiros] = useState(false);
  const [bio, setBio] = useState("Fotos de viaje y playa. Sets nuevos cada semana.");

  return (
    <div data-tema={tema} className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-20 px-4 pt-16 pb-28 sm:px-14">
        <header className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-4">
            <Logo />
            <h1 className="m-0 font-display text-5xl leading-[.98] font-semibold tracking-[-0.015em] sm:text-[64px]">
              Componentes
            </h1>
          </div>
          <Segmentado
            label="Tema"
            className="w-56"
            valor={tema}
            onChange={setTema}
            opciones={[
              { valor: "claro", label: "Claro" },
              { valor: "oscuro", label: "Oscuro" },
            ]}
          />
        </header>

        <Seccion n="01" titulo="botones" nota="Primario con degradado, uno por pantalla. Secundario con borde. De texto en rosa oscuro, apagado o destructivo. Desactivado al 40%.">
          <Boton>Desbloquear por {precioMXN(149)}</Boton>
          <Boton variante="secundario">Guardar imagen</Boton>
          <div className="flex flex-wrap gap-2">
            <Boton variante="texto">Probar con otra tarjeta</Boton>
            <Boton variante="texto" tono="apagado">
              Ahora no
            </Boton>
            <Boton variante="texto" tono="peligro">
              Bloquear a este fan
            </Boton>
          </div>
          <Boton disabled>Publicar set</Boton>
        </Seccion>

        <Seccion n="02" titulo="campos" nota="Píldora de 50px, label arriba. Bloqueado con candado. Textarea con radio 22px. Datos copiables en mono.">
          <Campo label="Correo para recibir el acceso" type="email" defaultValue="fan@correo.com" />
          <Campo label="Tu link" defaultValue="valeruiz" sufijo={<Estado tono="ok">Disponible</Estado>} ayuda="valeruiz.veloo.vip" />
          <Campo label="Correo de la compra" defaultValue="fan@correo.com" bloqueado />
          <Campo label="CLABE" mono inputMode="numeric" defaultValue="64618000123456" error="La CLABE tiene 18 dígitos. Te faltan 4." />
          <AreaTexto label="Bio" maxLength={120} contador value={bio} onChange={(e) => setBio(e.target.value)} />
          <DatoCopiable valor="https://valeruiz.veloo.vip/mazunte" mostrar="valeruiz.veloo.vip/mazunte" />
          <DatoCopiable label="CLABE para transferir" valor="646180001234567890" mostrar="6461 8000 1234 5678 90" />
        </Seccion>

        <Seccion n="03" titulo="selección" nota="Chips neutros para filtrar y rosas para sugerencias que llenan un campo (precios), segmentado para periodos, opción grande para métodos de pago, toggle para ajustes. Sin sombras.">
          <Chips
            label="Filtrar bóveda"
            valor={filtro}
            onChange={setFiltro}
            opciones={[
              { valor: "todo", label: "Todo" },
              { valor: "borradores", label: "Borradores" },
              { valor: "moderacion", label: "En moderación" },
              { valor: "publicados", label: "Publicados" },
              { valor: "rechazados", label: "Rechazados" },
            ]}
          />
          <Chips
            label="Precios sugeridos"
            tono="acento"
            valor={sugerido}
            onChange={setSugerido}
            opciones={["99", "149", "199"].map((s) => ({ valor: s, label: precio(Number(s)) }))}
          />
          <Segmentado
            label="Periodo"
            valor={periodo}
            onChange={setPeriodo}
            opciones={[
              { valor: "hoy", label: "Hoy" },
              { valor: "semana", label: "Semana" },
              { valor: "mes", label: "Mes" },
            ]}
          />
          <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-3 gap-2">
            <OpcionGrande seleccionada={metodo === "tarjeta"} onSelect={() => setMetodo("tarjeta")} icono={<CreditCardIcon weight="bold" size={20} />}>
              Tarjeta
            </OpcionGrande>
            <OpcionGrande seleccionada={metodo === "oxxo"} onSelect={() => setMetodo("oxxo")} icono={<StorefrontIcon weight="bold" size={20} />}>
              OXXO
            </OpcionGrande>
            <OpcionGrande seleccionada={metodo === "spei"} onSelect={() => setMetodo("spei")} icono={<BankIcon weight="bold" size={20} />}>
              SPEI
            </OpcionGrande>
          </div>
          <div className="flex items-center gap-3">
            <Toggle activo={ventas} onChange={setVentas} label="Ejemplo encendido" />
            <Toggle activo={!ventas} onChange={(v) => setVentas(!v)} label="Ejemplo apagado" />
          </div>
          <FilaToggle titulo="Cada venta" detalle="Sin fotos ni precios en la notificación" activo={ventas} onChange={setVentas} />
          <FilaToggle titulo="Retiros listos" activo={retiros} onChange={setRetiros} />
        </Seccion>

        <Seccion n="04" titulo="estados" nota="Punto + texto junto o debajo del título. La píldora rellena solo va sobre miniaturas, nunca encima de un titular.">
          <div className="flex flex-wrap gap-[18px]">
            <EstadoDeItem estado="publicado" />
            <EstadoDeItem estado="moderacion" />
            <EstadoDeItem estado="rechazado" />
            <EstadoDeItem estado="borrador" />
          </div>
          <div className="flex flex-wrap gap-2">
            <PildoraEstado tono="ok">Publicado</PildoraEstado>
            <PildoraEstado tono="warn">En moderación</PildoraEstado>
            <PildoraEstado tono="bad">Rechazado</PildoraEstado>
            <PildoraEstado tono="neutro">Borrador</PildoraEstado>
          </div>
        </Seccion>

        <Seccion n="05" titulo="lista y velo" nota="Fila con borde, sin sombra, miniatura de 64px. Velo de 12px en miniaturas y 34px en grande, con candado y precio. Video: play y duración. Pendiente: borde punteado.">
          <FilaLista
            miniatura={<Velo fuente={{ placeholder: "ph" }} className="size-16" />}
            titulo="Mazunte"
            meta="12 fotos · nuevo"
            derecha={precio(149)}
            href="#"
          />
          <FilaLista
            miniatura={<Velo fuente={{ placeholder: "ph3" }} duracion="2:14" className="size-16" />}
            titulo="Atardecer en la terraza"
            meta="Video · 2:14"
            derecha={precio(199)}
          />
          <FilaLista
            pendiente
            miniatura={<Velo fuente={{ placeholder: "ph2" }} className="size-16" />}
            titulo="Tulum"
            meta={<Estado tono="warn" className="text-[13px]">Esperando pago OXXO</Estado>}
            derecha={precio(99)}
          />
          <Velo fuente={{ placeholder: "ph" }} tamano="grande" precio={`12 fotos · ${precio(149)}`} className="h-[200px]" />
          <Velo fuente={{ placeholder: "ph4" }} tamano="grande" duracion="4:30" precio={precio(199)} className="h-[200px]" />
        </Seccion>

        <Seccion n="06" titulo="bóveda y marca de agua" nota="En la bóveda la creadora también ve velo; mantén presionado una miniatura para verla nítida. La marca de agua lleva el correo del comprador; en video se mueve.">
          <div className="grid grid-cols-2 gap-2.5">
            <VeloRevelable fuente={{ placeholder: "ph" }} nitida={{ placeholder: "ph" }} className="h-40">
              <PildoraEstado tono="ok" className="absolute top-2 left-2">
                Publicado
              </PildoraEstado>
            </VeloRevelable>
            <VeloRevelable fuente={{ placeholder: "ph3" }} nitida={{ placeholder: "ph3" }} duracion="0:42" className="h-40">
              <PildoraEstado tono="warn" className="absolute top-2 left-2">
                En moderación
              </PildoraEstado>
            </VeloRevelable>
          </div>
          <div className="relative h-[250px] overflow-hidden rounded-[22px]">
            <Miniatura fuente={{ placeholder: "ph" }} className="absolute inset-0 rounded-none" />
            <MarcaDeAgua correo="fan@correo.com" />
          </div>
          <div className="relative h-[150px] overflow-hidden rounded-[22px] bg-black">
            <Miniatura fuente={{ placeholder: "ph4" }} className="absolute inset-0 rounded-none opacity-80" />
            <MarcaDeAgua correo="fan@correo.com" tamano={11} movil />
          </div>
        </Seccion>

        <Seccion n="07" titulo="pantalla y pestañas" nota="Marco de 390×844 con CTA abajo. Barra de la creadora con + sólido; barra del fan solo con texto.">
          <div className="flex flex-col gap-2.5">
            <EtiquetaPantalla codigo="C4">Subir</EtiquetaPantalla>
            <MarcoMovil className="max-w-full">
              <TituloPantalla>Nuevo set</TituloPantalla>
              <div className="flex flex-col gap-4 px-5 pt-4">
                <div className="flex items-center gap-2.5">
                  <Avatar iniciales="VR" tamano={36} />
                  <span className="text-sm text-muted">Recibes {precio(netoCreadora(149))} por venta · comisión 20%</span>
                </div>
                <Campo label="Título" defaultValue="Mazunte" />
              </div>
              <ZonaCTA>
                <Boton>Mandar a revisión</Boton>
                <Boton variante="texto" tono="apagado">
                  Guardar borrador
                </Boton>
              </ZonaCTA>
              <BarraCreadora activa="boveda" />
            </MarcoMovil>
          </div>
          <div className="overflow-hidden rounded-[22px] border border-line">
            <BarraFan activa="inicio" />
          </div>
        </Seccion>
      </div>
    </div>
  );
}

function Seccion({ n, titulo, nota, children }: { n: string; titulo: string; nota: string; children: ReactNode }) {
  return (
    <section className="grid gap-8 md:grid-cols-[180px_minmax(0,1fr)]">
      <div className="text-sm font-bold text-accent-ink">
        {n} {titulo}
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex max-w-[390px] flex-col gap-3">{children}</div>
        <p className="m-0 text-sm leading-normal text-muted">{nota}</p>
      </div>
    </section>
  );
}

"use client";

import { XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SubidaFotos } from "@/components/creadora/subida-fotos";
import { Boton, Campo, Chips, ZonaCTA } from "@/components/ui";
import { cifra, netoCreadora, precio } from "@/lib/dinero";
import type { MedioSubido } from "@/lib/medios";
import { guardarBorrador } from "./acciones";
import { CabeceraCreadora } from "@/components/creadora/cabecera";

const SUGERIDOS = ["99", "149", "199"] as const;

/** C4 · Nuevo set, paso 1 de 2: fotos, título y precio. */
export function NuevoSet() {
  const router = useRouter();
  const [medios, setMedios] = useState<MedioSubido[]>([]);
  const [titulo, setTitulo] = useState("");
  const [monto, setMonto] = useState("149");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();

  const valor = Number(monto);
  const listo = medios.length > 0 && !subiendo && titulo.trim() !== "" && valor > 0;

  function continuar() {
    setError(undefined);
    iniciar(async () => {
      const r = await guardarBorrador({ titulo, precio: valor, fotoIds: medios.map((m) => m.id) });
      if (r.ok) router.push(`/app/sets/${r.setId}/consentimiento`);
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <Link href="/app/boveda" aria-label="Cerrar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <XIcon weight="bold" size={20} />
        </Link>
        <span className="flex-1 text-base font-semibold">Nuevo set</span>
        <span className="text-[13px] text-muted">1 de 2</span>
      </header>

      <CabeceraCreadora titulo="Algo nuevo, muy tuyo" detalle="Reúne tus fotos, elige un título y ponle precio a tu próximo set." />

      <div className="px-5">
        <SubidaFotos onChange={setMedios} onSubiendo={setSubiendo} />
      </div>

      <Campo
        label="Título"
        className="px-5 pt-[22px]"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={60}
        placeholder="Mazunte"
      />

      <div className="flex flex-col gap-2 px-5 pt-[18px]">
        <Campo
          label="Precio"
          inputMode="numeric"
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, "").slice(0, 5))}
          sufijo={<span className="text-[13px]">MXN</span>}
        />
        <Chips
          label="Precios sugeridos"
          tono="acento"
          valor={(SUGERIDOS as readonly string[]).includes(monto) ? monto : ""}
          onChange={setMonto}
          opciones={SUGERIDOS.map((s) => ({ valor: s, label: precio(Number(s)) }))}
        />
        {valor > 0 && (
          <p className="m-0 text-[13px] text-muted">
            Recibes <b className="font-semibold text-text">{cifra(netoCreadora(valor))}</b> por venta · comisión 20%
          </p>
        )}
      </div>

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={continuar} disabled={!listo || guardando}>
          {guardando ? "Guardando…" : "Continuar"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

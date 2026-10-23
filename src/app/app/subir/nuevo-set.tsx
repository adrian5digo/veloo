"use client";

import { CheckCircleIcon, ImagesIcon, UsersIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SubidaFotos } from "@/components/creadora/subida-fotos";
import { Boton, Campo, Chips, ZonaCTA } from "@/components/ui";
import { cifra, netoCreadora, precio } from "@/lib/dinero";
import type { MedioSubido } from "@/lib/medios";
import { guardarBorrador } from "./acciones";

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

      <div className="px-5 pb-5 pt-1">
        <h1 className="m-0 font-display text-[28px] font-semibold">Crea tu set</h1>
        <ol aria-label="Pasos para crear un set" className="m-0 mt-3 flex list-none items-center gap-3 p-0 text-[13px] font-semibold">
          <li aria-current="step" className="flex items-center gap-2 text-accent-ink"><ImagesIcon size={22} weight="bold" aria-hidden /> Fotos y precio</li>
          <li aria-hidden className="h-px flex-1 bg-line" />
          <li className="flex items-center gap-2 text-muted"><UsersIcon size={22} weight="bold" aria-hidden /> Confirmar</li>
        </ol>
      </div>

      <div className="px-5">
        <h2 className="mb-3 text-base font-bold">Tus fotos</h2>
        <SubidaFotos onChange={setMedios} onSubiendo={setSubiendo} />
      </div>

      <Campo
        label="Nombre del set"
        className="px-5 pt-[22px]"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={60}
        placeholder="Escribe el nombre de tu set"
      />

      <div className="flex flex-col gap-2 px-5 pt-[18px]">
        <Campo
          label="Precio por todas las fotos"
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
            Tú recibes <b className="font-semibold text-text">{cifra(netoCreadora(valor))} MXN</b> <span className="ml-2">Comisión 40%</span>
          </p>
        )}
      </div>

      <ZonaCTA>
        <div aria-live="polite" className="flex flex-wrap justify-center gap-4 text-[13px]">
          {[["Fotos", medios.length > 0 && !subiendo], ["Nombre", titulo.trim() !== ""], ["Precio", valor > 0]].map(([label, completo]) => (
            <span key={String(label)} className={`flex items-center gap-1.5 ${completo ? "text-accent-ink" : "text-muted"}`}>
              <CheckCircleIcon size={18} weight={completo ? "fill" : "regular"} aria-hidden />
              <span className="sr-only">{completo ? "Listo:" : "Falta:"} </span>{label}
            </span>
          ))}
        </div>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={continuar} disabled={!listo || guardando}>
          {guardando ? "Guardando…" : subiendo ? "Subiendo fotos…" : "Continuar"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

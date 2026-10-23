"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Boton, Campo, FilaLista, FilaToggle, Miniatura, ZonaCTA } from "@/components/ui";
import { crearCuenta } from "./acciones";

/** L3 · Cuenta de fan, después de comprar. El correo es el de la compra y no se edita. */
export function Cuenta({
  acceso,
  correo,
  titulo,
  creadora,
  portada,
}: {
  acceso: string;
  correo: string;
  titulo: string;
  creadora: string | null;
  portada: string | null;
}) {
  const [nombre, setNombre] = useState("");
  const [seguir, setSeguir] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string>();
  const [creando, iniciar] = useTransition();
  const volver = `/acceso/${acceso}`;

  function crear() {
    setError(undefined);
    iniciar(async () => {
      const r = await crearCuenta({ acceso, nombre, seguir });
      if (r.ok) setEnviado(true);
      else setError(r.error);
    });
  }

  if (enviado) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
        <section className="flex flex-col gap-2 px-6 pt-[72px]">
          <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">Revisa tu correo</h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            Te mandamos un link a <b className="font-semibold text-text">{correo}</b>. Al abrirlo queda lista tu cuenta, con tus compras adentro.
          </p>
        </section>
        <ZonaCTA>
          <Boton variante="secundario" href={volver}>
            Volver a mi compra
          </Boton>
        </ZonaCTA>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex justify-end px-5 py-2">
        <Link href={volver} aria-label="Cerrar" className="-mr-2.5 grid size-11 place-items-center text-text!">
          <XIcon weight="bold" size={20} />
        </Link>
      </header>
      <section className="flex flex-col gap-2 px-6 pt-2">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">Guarda tus compras en un solo lugar</h1>
        <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
          Con una cuenta puedes {creadora ? `seguir a ${creadora}, ` : ""}ver lo nuevo en tu feed y no depender del correo.
        </p>
      </section>

      <FilaLista
        className="mx-5 mt-[22px]"
        miniatura={portada ? <Miniatura fuente={{ src: portada }} className="size-16" /> : undefined}
        titulo={titulo}
        meta={
          <span className="flex items-center gap-1.5 text-ok">
            <CheckIcon weight="bold" size={14} />
            Ya es tuyo
          </span>
        }
      />

      <div className="flex flex-col gap-4 px-5 pt-5">
        <Campo label="Correo" value={correo} bloqueado readOnly />
        <Campo
          label="Nombre visible · opcional"
          placeholder="Como quieras que te vean"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={40}
        />
      </div>

      {creadora && (
        <div className="px-5 pt-[18px]">
          <FilaToggle titulo={`Seguir a ${creadora}`} activo={seguir} onChange={setSeguir} />
        </div>
      )}

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={crear} disabled={creando}>
          {creando ? "Creando…" : "Crear mi cuenta"}
        </Boton>
        <Boton variante="texto" tono="apagado" href={volver}>
          Ahora no
        </Boton>
      </ZonaCTA>
    </main>
  );
}

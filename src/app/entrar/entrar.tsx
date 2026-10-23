"use client";

import { ClockIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState, useTransition } from "react";
import { Boton, Campo, Logo, ZonaCTA } from "@/components/ui";
import { entrarConCodigo, mandarLink } from "./acciones";
import { AccesoContrasena } from "./contrasena";

const ESPERA_REENVIO = 60;

type Paso = { tipo: "correo" } | { tipo: "enviado"; correo: string } | { tipo: "vencido" };

/** L1 Entrar (link mágico + código de respaldo) y L2 Link vencido. */
export function Entrar({ siguiente, vencido, codigo = false }: { siguiente: string; vencido: boolean; codigo?: boolean }) {
  const [paso, setPaso] = useState<Paso>(vencido ? { tipo: "vencido" } : { tipo: "correo" });
  const [conCodigo, usarCodigo] = useState(vencido || codigo);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <div className="px-6 pt-6">
        <Logo tamano={28} />
      </div>
      {!conCodigo ? <AccesoContrasena siguiente={siguiente} onCodigo={() => usarCodigo(true)} /> : paso.tipo === "vencido" ? (
        <LinkVencido onNuevo={() => setPaso({ tipo: "correo" })} />
      ) : paso.tipo === "correo" ? (
        <PedirCorreo siguiente={siguiente} onEnviado={(correo) => setPaso({ tipo: "enviado", correo })} />
      ) : (
        <RevisaTuCorreo correo={paso.correo} siguiente={siguiente} onOtroCorreo={() => setPaso({ tipo: "correo" })} />
      )}
      {conCodigo && paso.tipo === "correo" && <div className="px-5 pb-5"><Boton variante="texto" className="w-full" onClick={() => usarCodigo(false)}>Entrar con usuario y contraseña</Boton></div>}
    </main>
  );
}

function PedirCorreo({ siguiente, onEnviado }: { siguiente: string; onEnviado: (correo: string) => void }) {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string>();
  const [enviando, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await mandarLink(correo, siguiente);
      if (r.ok) onEnviado(r.correo);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-2 px-6 pt-10">
        <h1 className="m-0 font-display text-[30px] leading-[1.1] font-semibold">Entra a tu cuenta</h1>
        <p className="m-0 text-[15px] text-muted">Te mandamos un link y un código para entrar, aunque hayas olvidado tu contraseña.</p>
      </div>
      <Campo
        label="Correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        className="px-5 pt-7"
        value={correo}
        onChange={(e) => {
          setCorreo(e.target.value);
          setError(undefined);
        }}
        error={error}
      />
      <ZonaCTA>
        <Boton type="submit" disabled={enviando || !correo}>
          {enviando ? "Mandando…" : "Mandarme el link"}
        </Boton>
      </ZonaCTA>
    </form>
  );
}

function RevisaTuCorreo({ correo, siguiente, onOtroCorreo }: { correo: string; siguiente: string; onOtroCorreo: () => void }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string>();
  const [aviso, setAviso] = useState<string>();
  const [espera, setEspera] = useState(ESPERA_REENVIO);
  const [pendiente, iniciar] = useTransition();

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  function entrar(valor = codigo) {
    iniciar(async () => {
      const r = await entrarConCodigo(correo, valor, siguiente);
      if (r?.error) setError(r.error);
    });
  }

  function reenviar() {
    iniciar(async () => {
      const r = await mandarLink(correo, siguiente);
      if (r.ok) {
        setEspera(ESPERA_REENVIO);
        setAviso("Te mandamos uno nuevo. Usa el más reciente.");
      } else setError(r.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-6 pt-10">
        <span className="grid size-14 place-items-center rounded-full bg-accent-soft text-accent-ink">
          <EnvelopeSimpleIcon weight="bold" size={24} />
        </span>
        <h1 className="m-0 font-display text-[30px] leading-[1.1] font-semibold">Revisa tu correo</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          Mandamos el link a <b className="font-bold text-text">{correo}</b>. Dura 15 minutos. Si no aparece, búscalo en
          promociones o spam.
        </p>
      </div>

      <Campo
        label="O escribe el código del correo"
        className="px-5 pt-7"
        mono
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={codigo}
        error={error}
        ayuda={aviso}
        onChange={(e) => {
          const limpio = e.target.value.replace(/\D/g, "").slice(0, 6);
          setCodigo(limpio);
          setError(undefined);
          if (limpio.length === 6) entrar(limpio);
        }}
      />

      <ZonaCTA>
        <Boton onClick={() => entrar()} disabled={codigo.length !== 6 || pendiente}>
          {pendiente ? "Entrando…" : "Entrar con el código"}
        </Boton>
        <Boton variante="secundario" onClick={onOtroCorreo}>
          Usar otro correo
        </Boton>
        {espera > 0 ? (
          <p className="m-0 text-center text-[13px] text-muted">
            Puedes pedir otro link en 0:{String(espera).padStart(2, "0")}
          </p>
        ) : (
          <Boton variante="texto" onClick={reenviar} disabled={pendiente}>
            Mandarme otro link
          </Boton>
        )}
      </ZonaCTA>
    </div>
  );
}

function LinkVencido({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-6 pt-10">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-warn">
          <ClockIcon weight="bold" size={18} />
          Pasaron más de 15 min
        </span>
        <h1 className="m-0 font-display text-[30px] leading-[1.1] font-semibold">Este link ya caducó</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          Por seguridad cada link sirve una sola vez y por poco tiempo. Tu cuenta y tus compras están intactas.
        </p>
      </div>
      <ZonaCTA>
        <Boton onClick={onNuevo}>Mandarme uno nuevo</Boton>
      </ZonaCTA>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Boton, Campo, ZonaCTA } from "@/components/ui";
import { crearConContrasena, entrarConContrasena } from "./acciones";

export function AccesoContrasena({ siguiente, onCodigo }: { siguiente: string; onCodigo: () => void }) {
  const [registro, registrar] = useState(false);
  const [usuario, cambiarUsuario] = useState("");
  const [correo, cambiarCorreo] = useState("");
  const [contrasena, cambiarContrasena] = useState("");
  const [error, cambiarError] = useState<string>();
  const [confirmacion, confirmar] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault(); cambiarError(undefined);
    iniciar(async () => {
      const r = registro ? await crearConContrasena({ usuario, correo, contrasena }, siguiente) : await entrarConContrasena(usuario, contrasena, siguiente);
      if (r?.error) cambiarError(r.error);
      else if (r && "correo" in r && r.correo) { confirmar(r.correo); cambiarContrasena(""); }
    });
  }

  if (confirmacion) return <div className="flex flex-1 flex-col"><div className="space-y-4 px-6 pt-10"><h1 className="font-display text-[30px] leading-tight font-semibold">Confirma tu correo</h1><p className="text-[15px] leading-relaxed text-muted">Revisa {confirmacion} y abre el link de confirmación. Después podrás entrar con tu usuario y contraseña.</p><p className="text-sm text-muted">Si ya tenías cuenta con ese correo, entra con un código y configura tu contraseña.</p></div><ZonaCTA><Boton onClick={onCodigo}>Entrar con un código</Boton><Boton variante="texto" onClick={() => { confirmar(undefined); registrar(false); }}>Volver al inicio de sesión</Boton></ZonaCTA></div>;

  return <form onSubmit={enviar} className="flex flex-1 flex-col">
    <div className="space-y-3 px-6 pt-10"><h1 className="m-0 font-display text-[30px] leading-tight font-semibold">{registro ? "Crea tu cuenta" : "Qué gusto verte"}</h1><p className="m-0 text-[15px] leading-relaxed text-muted">{registro ? "Elige cómo quieres entrar. Tu correo te ayuda a recuperar el acceso." : "Entra con tu usuario y contraseña para volver a tu bóveda."}</p></div>
    <div className="flex flex-col gap-5 px-5 pt-7">
      <Campo label="Usuario" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9_\-]{1,28}[a-z0-9]" value={usuario} onChange={(e) => cambiarUsuario(e.target.value.toLowerCase())} ayuda={registro ? "De 3 a 30 letras, números, guiones o guiones bajos. Es tu nombre para entrar, no tu link público." : undefined} />
      {registro && <Campo label="Correo" name="email" type="email" autoComplete="email" required value={correo} onChange={(e) => cambiarCorreo(e.target.value)} />}
      <Campo label="Contraseña" name="password" type="password" autoComplete={registro ? "new-password" : "current-password"} required minLength={registro ? 8 : undefined} maxLength={128} value={contrasena} onChange={(e) => cambiarContrasena(e.target.value)} ayuda={registro ? "Al menos 8 caracteres." : undefined} />
      {registro && <p className="m-0 text-xs leading-relaxed text-muted">Puedes revisar nuestros <Link href="/terminos">términos</Link> y el <Link href="/privacidad">aviso de privacidad</Link>. Para vender tendrás que confirmar tu edad y aceptar los términos del servicio.</p>}
      {error && <p role="alert" className="m-0 text-sm text-bad">{error}</p>}
    </div>
    <ZonaCTA className="pt-8"><Boton type="submit" disabled={pendiente}>{pendiente ? "Un momento…" : registro ? "Crear cuenta" : "Entrar"}</Boton><Boton variante="secundario" disabled={pendiente} onClick={() => { registrar(!registro); cambiarError(undefined); cambiarContrasena(""); }}>{registro ? "Ya tengo cuenta" : "Crear una cuenta"}</Boton><Boton variante="texto" disabled={pendiente} onClick={onCodigo}>Usar un código de correo</Boton>{!registro && <Boton variante="texto" href="/entrar?codigo=1&siguiente=/cuenta/seguridad">Olvidé mi contraseña</Boton>}</ZonaCTA>
  </form>;
}

"use client";
import { useState, useTransition } from "react";
import { Boton, Campo, Logo, ZonaCTA } from "@/components/ui";
import { guardarAcceso } from "@/app/entrar/acciones";

export function Seguridad({ usuario: inicial }: { usuario: string }) {
  const [usuario, cambiarUsuario] = useState(inicial);
  const [contrasena, cambiarContrasena] = useState("");
  const [mensaje, cambiarMensaje] = useState("");
  const [pendiente, iniciar] = useTransition();
  return <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col"><div className="px-6 pt-6"><Logo tamano={28} /></div><form className="flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); iniciar(async () => { const r = await guardarAcceso(usuario, contrasena); cambiarMensaje(r.error ?? "Listo. Ya puedes entrar con tu usuario y contraseña."); if (!r.error) cambiarContrasena(""); }); }}><div className="space-y-5 px-5 pt-10"><h1 className="font-display text-[28px] leading-tight font-semibold">Tu forma de entrar</h1><p className="text-sm text-muted">Configura tu usuario y una nueva contraseña. Tu link público sigue igual.</p><Campo label="Usuario" autoComplete="username" autoCapitalize="none" required minLength={3} maxLength={30} value={usuario} onChange={(e) => cambiarUsuario(e.target.value.toLowerCase())} /><Campo label="Nueva contraseña" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={contrasena} onChange={(e) => cambiarContrasena(e.target.value)} />{mensaje && <p role="status" className="text-sm text-muted">{mensaje}</p>}</div><ZonaCTA><Boton type="submit" disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar acceso"}</Boton><Boton href="/app" variante="texto">Volver a mi bóveda</Boton></ZonaCTA></form></main>;
}

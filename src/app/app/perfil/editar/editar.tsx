"use client";

import { CameraIcon, CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { AreaTexto, Avatar, Boton, Campo, ZonaCTA } from "@/components/ui";
import { reducirJpeg } from "@/lib/imagen";
import { linkVisible } from "@/lib/links";
import { guardarPerfil, subirAvatar } from "../acciones";

/** C9 · Editar perfil. */
export function Editar({
  nombre: nombreInicial,
  bio: bioInicial,
  usuario,
  avatar: avatarInicial,
  iniciales,
  puedeCambiarLink,
}: {
  nombre: string;
  bio: string;
  usuario: string;
  avatar?: string;
  iniciales: string;
  /** false si lo cambió hace menos de 90 días. */
  puedeCambiarLink: boolean;
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(nombreInicial);
  const [bio, setBio] = useState(bioInicial);
  const [cambiandoLink, setCambiandoLink] = useState(false);
  const [nuevoLink, setNuevoLink] = useState(usuario);
  const [avatar, setAvatar] = useState(avatarInicial);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();

  async function elegirFoto(archivo: File | undefined) {
    if (!archivo) return;
    setError(undefined);
    setSubiendo(true);
    try {
      const datos = new FormData();
      datos.set("foto", await reducirJpeg(archivo, 800, 0.88), "avatar.jpg");
      const r = await subirAvatar(datos);
      if (!r.ok) setError(r.error);
      else if (r.url) setAvatar(r.url);
    } catch {
      setError("No se pudo subir la foto. Revisa tu conexión y vuelve a intentar.");
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  function guardar() {
    setError(undefined);
    iniciar(async () => {
      const r = await guardarPerfil({ nombre, bio, usuario: cambiandoLink && nuevoLink !== usuario ? nuevoLink : undefined });
      if (r.ok) router.push("/app/perfil");
      else setError(r.error);
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <Link href="/app/perfil" aria-label="Regresar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <span className="flex-1 text-base font-bold">Editar perfil</span>
      </header>

      <section className="flex items-center gap-4 px-5 pt-1.5">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          aria-label="Cambiar foto de perfil"
          className="relative flex-none cursor-pointer disabled:opacity-60"
        >
          <Avatar iniciales={iniciales} src={avatar} tamano={84} />
          <span className="absolute -right-0.5 -bottom-0.5 grid size-8 place-items-center rounded-full border-[3px] border-bg bg-text text-bg">
            <CameraIcon weight="bold" size={15} />
          </span>
        </button>
        <input ref={entrada} type="file" accept="image/*" className="hidden" onChange={(e) => elegirFoto(e.target.files?.[0])} />
        <p className="m-0 flex-1 text-[13px] leading-[1.45] text-pretty text-muted">
          {subiendo ? "Subiendo foto…" : "La foto de perfil es pública y aparece en tus historias. Mejor sin contenido de pago."}
        </p>
      </section>

      <div className="flex flex-col gap-4 px-5 pt-[22px]">
        <Campo label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} />
        <AreaTexto
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={120}
          contador
          ayuda="Se ve en tu página pública"
        />
        {cambiandoLink ? (
          <Campo
            label="Tu link"
            value={nuevoLink}
            onChange={(e) => setNuevoLink(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30))}
            autoCapitalize="none"
            spellCheck={false}
            mono
            sufijo={<span className="font-mono text-sm">.{process.env.NEXT_PUBLIC_DOMINIO || "veloo.vip"}</span>}
            ayuda="El link anterior deja de servir, también en historias ya publicadas."
          />
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">Tu link</span>
            <div className="flex min-h-[50px] items-center rounded-full border border-line bg-surface-2 px-[18px] font-mono text-sm text-muted">
              {linkVisible(usuario)}
            </div>
            <span className="px-1 text-xs text-muted">
              Se puede cambiar una vez cada 90 días.{" "}
              {puedeCambiarLink && (
                <button type="button" onClick={() => setCambiandoLink(true)} className="cursor-pointer font-bold text-accent-ink">
                  Cambiar
                </button>
              )}
            </span>
          </div>
        )}
      </div>

      <ZonaCTA>
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={guardar} disabled={guardando || subiendo || !nombre.trim()}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

"use client";

import { ArrowDownIcon, ArrowUpIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useTransition } from "react";
import { Encabezado } from "@/components/creadora/encabezado";
import { IconoRed } from "@/components/fan/icono-red";
import { Boton, Campo, Toggle, ZonaCTA } from "@/components/ui";
import { cn } from "@/lib/cn";
import { linkVisible } from "@/lib/links";
import { NOMBRE_RED, normalizarUrl, redDe, type Red } from "@/lib/redes";
import { alternarLink, borrarLink, crearLink, editarLink, ordenarLinks } from "./acciones";

type Link = { id: string; titulo: string; url: string; red: Red; activo: boolean; clics: number };

const miles = new Intl.NumberFormat("es-MX");
const sinEsquema = (url: string) => url.replace(/^https:\/\//, "");
const icono = "grid size-11 flex-none cursor-pointer place-items-center rounded-full text-muted disabled:opacity-30";

/** C8 · Mis links: agregar, editar, ordenar, apagar y borrar. Máximo 20. */
export function Links({ usuario, iniciales }: { usuario: string; iniciales: Link[] }) {
  const [links, setLinks] = useState(iniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tituloTocado, setTituloTocado] = useState(false);
  const [error, setError] = useState<string>();
  const [ocupado, iniciar] = useTransition();

  // Al pegar el link se propone el nombre de la red ("Instagram") mientras no lo hayan escrito.
  function cambiarUrl(valor: string) {
    setUrl(valor);
    if (tituloTocado) return;
    const limpia = normalizarUrl(valor);
    setTitulo(limpia ? NOMBRE_RED[redDe(limpia)] : "");
  }

  function empezarEdicion(l: Link) {
    setEditando(l.id);
    setUrl(sinEsquema(l.url));
    setTitulo(l.titulo);
    setTituloTocado(true);
    setError(undefined);
  }

  function limpiar() {
    setEditando(null);
    setUrl("");
    setTitulo("");
    setTituloTocado(false);
  }

  function guardar() {
    setError(undefined);
    iniciar(async () => {
      const limpia = normalizarUrl(url);
      const datos = { url: limpia ?? "", titulo: titulo.trim(), red: redDe(limpia ?? "") };
      if (editando) {
        const r = await editarLink(editando, url, titulo);
        if (!r.ok) return setError(r.error);
        setLinks((ls) => ls.map((l) => (l.id === editando ? { ...l, ...datos } : l)));
      } else {
        const r = await crearLink(url, titulo);
        if (!r.ok) return setError(r.error);
        setLinks((ls) => [...ls, { id: r.id, ...datos, activo: true, clics: 0 }]);
      }
      limpiar();
    });
  }

  function mover(i: number, delta: -1 | 1) {
    const nuevos = [...links];
    [nuevos[i], nuevos[i + delta]] = [nuevos[i + delta], nuevos[i]];
    const antes = links;
    setLinks(nuevos);
    iniciar(async () => {
      const r = await ordenarLinks(nuevos.map((l) => l.id));
      if (!r.ok) {
        setLinks(antes);
        setError(r.error);
      }
    });
  }

  function alternar(l: Link, activo: boolean) {
    setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, activo } : x)));
    iniciar(async () => {
      const r = await alternarLink(l.id, activo);
      if (!r.ok) {
        setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, activo: !activo } : x)));
        setError(r.error);
      }
    });
  }

  function borrar(id: string) {
    setError(undefined);
    iniciar(async () => {
      const r = await borrarLink(id);
      if (!r.ok) return setError(r.error);
      setLinks((ls) => ls.filter((l) => l.id !== id));
      setPorBorrar(null);
      if (editando === id) limpiar();
    });
  }

  const lleno = links.length >= 20 && !editando;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <Encabezado atras="/app/perfil" titulo="Mis links" />
      <p className="m-0 px-6 text-sm leading-normal text-pretty text-muted">
        Salen en <span className="font-mono text-[13px] text-text">{linkVisible(usuario)}</span>, arriba de tus sets. Pon tus otras redes, tu web o tu WhatsApp.
      </p>

      <section className="flex flex-col px-5 pt-5">
        {links.length === 0 && (
          <p className="m-0 border-y border-line py-5 text-[15px] leading-normal text-muted">
            Todavía no tienes links. Agrega el primero abajo: con pegar el link basta, el nombre se pone solo.
          </p>
        )}
        {links.map((l, i) => (
          <div key={l.id} className={cn("flex items-center gap-1 border-b border-line py-2", editando === l.id && "bg-accent-soft")}>
            <span className={cn("grid size-11 flex-none place-items-center", !l.activo && "opacity-40")}>
              <IconoRed red={l.red} />
            </span>
            <div className={cn("min-w-0 flex-1", !l.activo && "opacity-50")}>
              <div className="truncate text-[15px] font-semibold">{l.titulo}</div>
              <div className="truncate text-xs text-muted">
                <span className="font-mono">{sinEsquema(l.url)}</span> · {l.clics === 1 ? "1 clic" : `${miles.format(l.clics)} clics`}
              </div>
            </div>
            {porBorrar === l.id ? (
              <span className="flex items-center gap-1">
                <button type="button" onClick={() => setPorBorrar(null)} className="min-h-11 cursor-pointer px-2.5 text-[13px] font-semibold text-muted">
                  No
                </button>
                <button type="button" disabled={ocupado} onClick={() => borrar(l.id)} className="min-h-11 cursor-pointer px-2.5 text-[13px] font-bold text-bad">
                  Sí, borrar
                </button>
              </span>
            ) : (
              <>
                <button type="button" aria-label="Subir" disabled={i === 0 || ocupado} onClick={() => mover(i, -1)} className={icono}>
                  <ArrowUpIcon weight="bold" size={18} />
                </button>
                <button type="button" aria-label="Bajar" disabled={i === links.length - 1 || ocupado} onClick={() => mover(i, 1)} className={icono}>
                  <ArrowDownIcon weight="bold" size={18} />
                </button>
                <button type="button" aria-label="Editar" onClick={() => empezarEdicion(l)} className={icono}>
                  <PencilSimpleIcon weight="bold" size={18} />
                </button>
                <button type="button" aria-label="Borrar" onClick={() => setPorBorrar(l.id)} className={icono}>
                  <TrashIcon weight="bold" size={18} />
                </button>
                <Toggle activo={l.activo} onChange={(v) => alternar(l, v)} label={l.activo ? `Ocultar ${l.titulo}` : `Mostrar ${l.titulo}`} className="ml-1" />
              </>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3.5 px-5 pt-7">
        <h2 className="m-0 text-[13px] font-semibold">{editando ? "Editar link" : "Agregar link"}</h2>
        <Campo
          label="Link"
          mono
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          placeholder="instagram.com/tuusuario"
          value={url}
          onChange={(e) => cambiarUrl(e.target.value)}
          disabled={lleno}
        />
        <Campo
          label="Nombre del botón"
          maxLength={40}
          placeholder="Instagram"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            setTituloTocado(true);
          }}
          disabled={lleno}
          ayuda={lleno ? "Ya tienes 20 links. Borra uno para agregar otro." : undefined}
        />
      </section>

      <ZonaCTA className="gap-2">
        {error && <p className="m-0 text-[13px] font-semibold text-bad">{error}</p>}
        <Boton onClick={guardar} disabled={ocupado || lleno || !url.trim() || !titulo.trim()}>
          {ocupado ? "Guardando…" : editando ? "Guardar cambios" : "Agregar link"}
        </Boton>
        {editando && (
          <Boton variante="texto" tono="apagado" onClick={limpiar}>
            Cancelar
          </Boton>
        )}
      </ZonaCTA>
    </main>
  );
}

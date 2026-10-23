"use client";

import { PlusIcon, WarningIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PildoraEstado, VeloRevelable } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MAX_BYTES_FOTO, type MedioSubido, type SubidaPreparada } from "@/lib/medios";

type Item =
  | { clave: string; nombre: string; estado: "subiendo"; progreso: number }
  | { clave: string; nombre: string; estado: "listo"; medio: MedioSubido }
  | { clave: string; nombre: string; estado: "error"; error: string };

const SUBIDAS_A_LA_VEZ = 3;
const SIGUE_EN_TU_TELEFONO = "Tu foto sigue en tu teléfono; vuelve a intentar.";

/**
 * Grid de subida del set (C4). La creadora sube la foto normal; el servidor genera el velo.
 * Mientras sube no se muestra vista previa local: en la app nada se ve nítido salvo
 * al mantener presionado.
 */
export function SubidaFotos({
  onChange,
  onSubiendo,
}: {
  onChange?: (medios: MedioSubido[]) => void;
  /** true mientras alguna foto sigue subiendo o procesándose. */
  onSubiendo?: (subiendo: boolean) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const cola = useRef<Array<{ clave: string; archivo: File }>>([]);
  const activas = useRef(0);
  const inputId = useId();

  useEffect(() => {
    onChange?.(items.flatMap((i) => (i.estado === "listo" ? [i.medio] : [])));
    onSubiendo?.(items.some((i) => i.estado === "subiendo"));
  }, [items, onChange, onSubiendo]);

  const actualizar = useCallback((clave: string, item: Item) => {
    setItems((prev) => prev.map((i) => (i.clave === clave ? item : i)));
  }, []);

  // Solo usa refs y `actualizar` (estable), así que puede llamarse desde cualquier render.
  function bombear() {
    while (activas.current < SUBIDAS_A_LA_VEZ && cola.current.length > 0) {
      const { clave, archivo } = cola.current.shift()!;
      activas.current++;
      subir(archivo, (progreso) => actualizar(clave, { clave, nombre: archivo.name, estado: "subiendo", progreso }))
        .then((medio) => actualizar(clave, { clave, nombre: archivo.name, estado: "listo", medio }))
        .catch((e: Error) => actualizar(clave, { clave, nombre: archivo.name, estado: "error", error: e.message }))
        .finally(() => {
          activas.current--;
          bombear();
        });
    }
  }

  function agregar(archivos: FileList | null) {
    if (!archivos?.length) return;
    const nuevos: Item[] = [];
    for (const archivo of Array.from(archivos)) {
      const clave = crypto.randomUUID();
      if (archivo.size > MAX_BYTES_FOTO) {
        nuevos.push({
          clave,
          nombre: archivo.name,
          estado: "error",
          error: `Pesa más de ${MAX_BYTES_FOTO / 1024 / 1024} MB. Súbela en menor resolución.`,
        });
        continue;
      }
      nuevos.push({ clave, nombre: archivo.name, estado: "subiendo", progreso: 0 });
      cola.current.push({ clave, archivo });
    }
    setItems((prev) => [...prev, ...nuevos]);
    bombear();
  }

  function quitar(item: Item) {
    setItems((prev) => prev.filter((i) => i.clave !== item.clave));
    if (item.estado === "listo") {
      fetch(`/api/creadora/medios/${item.medio.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  const listos = items.filter((i) => i.estado === "listo");
  const portada = listos[0]?.clave;
  const errores = items.filter((i) => i.estado === "error");

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((item) =>
          item.estado === "listo" ? (
            <VeloRevelable
              key={item.clave}
              fuente={{ src: item.medio.velo.mini }}
              nitida={{ src: item.medio.vista }}
              className="aspect-square"
            >
              {item.clave === portada && (
                <PildoraEstado tono="neutro" className="absolute top-1.5 left-1.5 text-[10px] text-text">
                  Portada
                </PildoraEstado>
              )}
              <BotonQuitar onClick={() => quitar(item)} />
            </VeloRevelable>
          ) : item.estado === "subiendo" ? (
            <div
              key={item.clave}
              className="relative grid aspect-square place-items-center overflow-hidden rounded-[14px] bg-surface-2"
              aria-label={`Subiendo ${item.nombre}`}
            >
              <span className="text-xs font-semibold text-muted">
                {item.progreso < 1 ? `${Math.round(item.progreso * 100)}%` : "Velo…"}
              </span>
              <span className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-accent transition-[width] duration-200"
                  style={{ width: `${Math.max(4, item.progreso * 100)}%` }}
                />
              </span>
            </div>
          ) : (
            <div
              key={item.clave}
              className="relative grid aspect-square place-items-center rounded-[14px] border-[1.5px] border-dashed border-bad bg-bad-soft text-bad"
            >
              <WarningIcon weight="bold" size={20} aria-label={`No se subió ${item.nombre}`} />
              <BotonQuitar onClick={() => quitar(item)} />
            </div>
          ),
        )}
        <label
          htmlFor={inputId}
          className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-accent bg-accent-soft p-4 font-semibold text-accent-ink hover:bg-surface-2", items.length === 0 ? "col-span-4 min-h-36" : "aspect-square text-xs")}
        >
          <PlusIcon weight="bold" size={22} aria-label="Agregar fotos" />
          <span>{items.length ? "Agregar" : "Toca aquí para elegir tus fotos"}</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <p className="m-0 text-xs text-muted">
        {listos.length === 0
          ? "Puedes elegir varias a la vez. Nosotros las protegemos con un velo."
          : `${listos.length} ${listos.length === 1 ? "foto lista" : "fotos listas"}. La primera será la portada. Mantén presionada una foto para verla.`}
      </p>

      {errores.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] text-bad">
          {errores.map((e) => (
            <li key={e.clave}>
              <b className="font-bold">{e.nombre}:</b> {e.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BotonQuitar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Quitar foto"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={cn(
        "absolute top-1 right-1 z-10 grid size-6 cursor-pointer place-items-center rounded-full bg-black/28 text-white",
        // Área táctil de 44px sin agrandar el círculo.
        "after:absolute after:-inset-2.5 after:content-['']",
      )}
    >
      <XIcon weight="bold" size={14} />
    </button>
  );
}

/** Pide el link firmado, sube la foto directo a storage y luego pide el velo. */
async function subir(archivo: File, onProgreso: (p: number) => void): Promise<MedioSubido> {
  const preparada = await pedirJson<SubidaPreparada>("/api/creadora/medios", "No se pudo empezar la subida.");
  await subirArchivo(preparada.url, archivo, onProgreso);
  return pedirJson<MedioSubido>(`/api/creadora/medios/${preparada.id}/procesar`, "No pudimos ponerle el velo.");
}

async function pedirJson<T>(url: string, fallo: string): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { method: "POST" });
  } catch {
    throw new Error(`Se cortó la conexión. ${SIGUE_EN_TU_TELEFONO}`);
  }
  const cuerpo = (await respuesta.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!respuesta.ok || !cuerpo) throw new Error(cuerpo?.error ?? `${fallo} ${SIGUE_EN_TU_TELEFONO}`);
  return cuerpo;
}

/** PUT directo al link firmado de Supabase Storage, con progreso. */
function subirArchivo(url: string, archivo: File, onProgreso: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    if (archivo.type) xhr.setRequestHeader("content-type", archivo.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgreso(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      reject(
        new Error(
          xhr.status === 413 || xhr.status === 415
            ? "Ese archivo no lo aceptamos. Súbela como JPG o PNG de menos de 40 MB."
            : `No se pudo subir. ${SIGUE_EN_TU_TELEFONO}`,
        ),
      );
    };
    xhr.onerror = () => reject(new Error(`Se cortó la conexión. ${SIGUE_EN_TU_TELEFONO}`));
    xhr.send(archivo);
  });
}

"use client";

import { HeartIcon } from "@phosphor-icons/react/dist/ssr";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { meGusta, seguir } from "@/app/explorar/acciones";

/** S3: Seguir / Siguiendo. Sin sesión, manda a entrar y regresa. */
export function BotonSeguir({ creadoraId, inicial, className }: { creadoraId: string; inicial: boolean; className?: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const [siguiendo, setSiguiendo] = useState(inicial);
  const [ocupado, iniciar] = useTransition();
  function alternar() {
    const nuevo = !siguiendo;
    setSiguiendo(nuevo);
    iniciar(async () => {
      const r = await seguir(creadoraId, nuevo);
      if (!r.ok) {
        setSiguiendo(!nuevo);
        if (r.entrar) router.push(`/entrar?siguiente=${encodeURIComponent(ruta)}`);
      }
    });
  }
  return (
    <button
      type="button"
      aria-pressed={siguiendo}
      onClick={alternar}
      disabled={ocupado}
      className={cn(
        "grid min-h-12 cursor-pointer place-items-center rounded-full border px-5 text-[15px] font-semibold",
        siguiendo ? "border-line bg-surface text-text" : "border-text bg-text text-bg",
        className,
      )}
    >
      {siguiendo ? "Siguiendo" : "Seguir"}
    </button>
  );
}

/** S1: me gusta con contador. */
export function BotonMeGusta({ setId, inicial, total }: { setId: string; inicial: boolean; total: number }) {
  const router = useRouter();
  const ruta = usePathname();
  const [gusta, setGusta] = useState(inicial);
  const [, iniciar] = useTransition();
  const cuenta = total + (gusta ? 1 : 0) - (inicial ? 1 : 0);
  function alternar() {
    const nuevo = !gusta;
    setGusta(nuevo);
    iniciar(async () => {
      const r = await meGusta(setId, nuevo);
      if (!r.ok) {
        setGusta(!nuevo);
        if (r.entrar) router.push(`/entrar?siguiente=${encodeURIComponent(ruta)}`);
      }
    });
  }
  return (
    <button
      type="button"
      aria-pressed={gusta}
      aria-label={gusta ? "Quitar me gusta" : "Me gusta"}
      onClick={alternar}
      className={cn("-ml-2 flex min-h-11 cursor-pointer items-center gap-1.5 px-2 text-[13px]", gusta ? "text-accent-ink" : "text-muted")}
    >
      <HeartIcon weight={gusta ? "fill" : "bold"} size={18} />
      {cuenta}
    </button>
  );
}

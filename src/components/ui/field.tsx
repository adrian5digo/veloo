"use client";

import { EyeIcon, EyeSlashIcon, LockIcon } from "@phosphor-icons/react/dist/ssr";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const campoBase =
  "w-full border border-line bg-surface text-text text-base font-medium outline-none transition-[border-color,box-shadow] " +
  "placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] " +
  "aria-invalid:border-bad aria-invalid:focus:shadow-[0_0_0_3px_var(--bad-soft)]";

type Envoltura = {
  label: string;
  /** Texto de ayuda debajo, en muted. */
  ayuda?: ReactNode;
  /** Mensaje de error; también marca el campo como inválido. */
  error?: string;
  className?: string;
};

function Etiqueta({ id, label, children, ayuda, error, className }: Envoltura & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="m-0 px-1 text-[13px] font-semibold text-bad">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-msg`} className="m-0 px-1 text-[13px] text-muted">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

type CampoProps = Envoltura &
  Omit<ComponentProps<"input">, "className"> & {
    /** Campo bloqueado (ej. correo de la compra, titular de la INE). */
    bloqueado?: boolean;
    /** Datos técnicos: CLABE, tarjeta, referencias. */
    mono?: boolean;
    /** Elemento a la derecha dentro de la píldora (ej. "Disponible"). */
    sufijo?: ReactNode;
  };

export function Campo({ label, ayuda, error, className, bloqueado, mono, sufijo, id, ...input }: CampoProps) {
  const autoId = useId();
  const campoId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const esContrasena = input.type === "password";
  return (
    <Etiqueta id={campoId} label={label} ayuda={ayuda} error={error} className={className}>
      <div className="relative">
        <input
          id={campoId}
          readOnly={bloqueado || input.readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || ayuda ? `${campoId}-msg` : undefined}
          className={cn(
            campoBase,
            "min-h-[50px] rounded-full px-[18px]",
            mono && "font-mono text-[15px]",
            bloqueado && "bg-surface-2 text-muted focus:border-line focus:shadow-none",
            bloqueado ? "pr-12" : sufijo != null && "pr-32",
            esContrasena && (bloqueado || sufijo != null ? "pr-44" : "pr-14"),
          )}
          {...input}
          type={esContrasena && visible ? "text" : input.type}
        />
        {(bloqueado || sufijo) && (
          <span className={cn("pointer-events-none absolute inset-y-0 flex items-center text-muted", esContrasena ? "right-14" : "right-[18px]")}>
            {bloqueado ? <LockIcon weight="bold" size={18} aria-label="Bloqueado" /> : sufijo}
          </span>
        )}
        {esContrasena && (
          <button
            type="button"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-controls={campoId}
            disabled={input.disabled}
            onClick={() => setVisible((anterior) => !anterior)}
            className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-accent-ink hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visible ? <EyeSlashIcon size={22} weight="bold" aria-hidden /> : <EyeIcon size={22} weight="bold" aria-hidden />}
          </button>
        )}
      </div>
    </Etiqueta>
  );
}

type AreaProps = Envoltura &
  Omit<ComponentProps<"textarea">, "className"> & {
    /** Muestra el contador "n/max" cuando hay maxLength. */
    contador?: boolean;
  };

export function AreaTexto({ label, ayuda, error, className, contador, id, ...area }: AreaProps) {
  const autoId = useId();
  const campoId = id ?? autoId;
  const largo = typeof area.value === "string" ? area.value.length : undefined;
  return (
    <Etiqueta
      id={campoId}
      label={label}
      error={error}
      className={className}
      ayuda={
        contador && area.maxLength && largo !== undefined ? (
          <span className="flex justify-between gap-3">
            <span>{ayuda}</span>
            <span className="font-mono text-xs">
              {largo}/{area.maxLength}
            </span>
          </span>
        ) : (
          ayuda
        )
      }
    >
      <textarea
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda || contador ? `${campoId}-msg` : undefined}
        className={cn(campoBase, "min-h-24 resize-none rounded-[22px] px-[18px] py-3.5 leading-normal")}
        {...area}
      />
    </Etiqueta>
  );
}

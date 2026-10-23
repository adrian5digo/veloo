import { LockIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";
import { NavPanel } from "./nav";

export const metadata: Metadata = { title: "Equipo · Veloo", robots: { index: false } };

export default async function Layout({ children }: LayoutProps<"/panel">) {
  const staff = await staffActual();
  // Sin sesión, el proxy ya mandó a /entrar. Con sesión pero fuera del equipo: no existe.
  if (!staff) notFound();

  const db = supabaseAdmin();
  const [{ count: sets }, { count: creadoras }, { count: reportes }, { count: pagos }] = await Promise.all([
    db.from("sets").select("id", { count: "exact", head: true }).eq("estado", "moderacion"),
    db.from("creadoras").select("id", { count: "exact", head: true }).in("verificacion", ["pendiente", "en_revision"]),
    db.from("reportes").select("id", { count: "exact", head: true }).eq("estado", "abierto"),
    db.from("ordenes").select("id", { count: "exact", head: true }).eq("procesador", "spei_manual").eq("estado", "pendiente"),
  ]);

  return (
    <div className="grid h-dvh min-h-[640px] grid-cols-[220px_minmax(0,1fr)] bg-bg text-text">
      <nav aria-label="Panel" className="flex flex-col gap-1 border-r border-line bg-surface px-3.5 py-[22px]">
        <div className="flex items-center gap-2 px-2.5 pb-[18px] font-display text-lg font-semibold">
          <span className="grid size-6 place-items-center rounded-full bg-text text-bg">
            <LockIcon weight="bold" size={12} />
          </span>
          veloo · equipo
        </div>
        <NavPanel conteos={{ moderacion: sets ?? 0, verificaciones: creadoras ?? 0, reportes: reportes ?? 0, pagos: pagos ?? 0 }} />
        <p className="m-0 mt-auto p-3 text-xs leading-normal text-muted">
          Sesión: {staff.nombre}
          <br />
          Todo lo que abres queda registrado.
        </p>
      </nav>
      {children}
    </div>
  );
}

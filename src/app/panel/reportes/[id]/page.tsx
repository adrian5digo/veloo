import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { ID_MEDIO } from "@/lib/medios";
import { horaCorta } from "@/lib/tiempo";
import { registrarAcceso, staffActual } from "@/server/staff";
import { supabaseAdmin } from "@/server/supabase";

/**
 * A4 · Conversación reportada. El equipo solo puede abrir conversaciones con reporte, y cada vez
 * queda en el registro. Se resuelve desde la cola (Sin falta) o bloqueando/quitando desde Supabase.
 */
export default async function Page({ params }: PageProps<"/panel/reportes/[id]">) {
  const { id } = await params;
  if (!ID_MEDIO.test(id)) notFound();
  const staff = await staffActual();
  if (!staff) notFound();

  const db = supabaseAdmin();
  const { data: reporte } = await db.from("reportes").select("folio, motivo, detalle, conversacion_id, creado_en").eq("id", id).maybeSingle();
  if (!reporte?.conversacion_id) notFound();
  await registrarAcceso(staff.id, "ver_conversacion", "conversacion", reporte.conversacion_id);

  const { data: conv } = await db.from("conversaciones").select("creadora_id, fan_id").eq("id", reporte.conversacion_id).single();
  if (!conv) notFound();
  const [{ data: mensajes }, { data: creadora }, { data: fan }, { data: usuario }] = await Promise.all([
    db.from("mensajes").select("id, autor, texto, set_id, creado_en").eq("conversacion_id", reporte.conversacion_id).order("id").limit(500),
    db.from("creadoras").select("nombre, usuario").eq("id", conv.creadora_id).single(),
    db.from("fans").select("nombre_visible, mayor_edad_en").eq("id", conv.fan_id).single(),
    db.auth.admin.getUserById(conv.fan_id),
  ]);

  return (
    <section className="flex min-h-0 flex-col overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-line px-7 py-[18px]">
        <Link href="/panel/reportes" aria-label="Reportes" className="grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="m-0 font-display text-[22px] font-semibold">
            Conversación · <span className="font-mono text-base">{reporte.folio}</span>
          </h1>
          <p className="m-0 text-[13px] text-muted">
            {creadora?.nombre || creadora?.usuario} con {fan?.nombre_visible || "fan sin nombre"} (
            <span className="font-mono">{usuario.user?.email}</span>) · 18+ confirmado: {fan?.mayor_edad_en ? horaCorta(fan.mayor_edad_en) : "no"}
          </p>
        </div>
      </div>
      {reporte.detalle && <p className="m-0 border-b border-line bg-warn-soft px-7 py-3 text-sm">“{reporte.detalle}”</p>}
      <div className="flex max-w-[720px] flex-col gap-2 px-7 py-5">
        {(mensajes ?? []).map((m) => (
          <div key={m.id} className={cn("flex flex-col gap-0.5", m.autor === "creadora" ? "items-end" : "items-start")}>
            <p
              className={cn(
                "m-0 max-w-[75%] rounded-[22px] px-4 py-2.5 text-sm break-words whitespace-pre-wrap",
                m.autor === "creadora" ? "bg-text text-bg" : "border border-line bg-surface",
              )}
            >
              {m.texto ?? ""}
              {m.set_id && <span className="block text-xs opacity-70">Adjuntó un set</span>}
            </p>
            <span className="text-xs text-muted">
              {m.autor === "creadora" ? "Creadora" : "Fan"} · {horaCorta(m.creado_en)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

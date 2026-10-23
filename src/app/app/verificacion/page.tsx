import { ClockIcon, CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boton } from "@/components/ui";
import { creadoraActual } from "@/server/sesion";
import { supabaseServidor } from "@/server/supabase";
import { Captura } from "./captura";

export const metadata: Metadata = { title: "Verifica tu identidad · Veloo" };

/** C2 → C2c. Qué se muestra depende del último intento. */
export default async function Page() {
  const creadora = await creadoraActual();
  if (!creadora) redirect("/entrar?siguiente=/app/verificacion");
  const supabase = await supabaseServidor();
  const [{ data: perfil }, { data: ultimo }] = await Promise.all([
    supabase.from("creadoras").select("verificacion").eq("id", creadora.id).single(),
    supabase.from("verificaciones").select("estado, motivo").eq("creadora_id", creadora.id).order("creada_en", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (perfil?.verificacion === "aprobada") redirect("/app/boveda");
  if (perfil?.verificacion === "en_revision") return <EnRevision />;
  if (perfil?.verificacion === "rechazada") return <Rechazada motivo={ultimo?.motivo ?? null} />;
  return <Captura otraVez={ultimo?.estado === "pide_otra_foto" ? (ultimo.motivo ?? "Necesitamos otra foto. Tómala con buena luz y sin reflejos.") : null} />;
}

/** C2c · En revisión. */
function EnRevision() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg px-7">
      <span className="mt-[140px] grid size-14 place-items-center rounded-full bg-warn-soft text-warn">
        <ClockIcon weight="bold" size={26} />
      </span>
      <h1 className="m-0 mt-6 font-display text-[28px] leading-[1.1] font-semibold tracking-[-0.01em]">Estamos revisando tu identidad</h1>
      <p className="m-0 mt-3 text-[15px] leading-normal text-pretty text-muted">
        Una persona del equipo lo revisa a mano. Suele tardar menos de 24 horas y te avisamos por correo.
      </p>
      <ul className="m-0 mt-7 flex list-none flex-col gap-3 p-0 text-sm">
        <li className="flex items-center gap-2.5">
          <CheckIcon weight="bold" size={18} className="text-ok" />
          INE frente y reverso
        </li>
        <li className="flex items-center gap-2.5">
          <CheckIcon weight="bold" size={18} className="text-ok" />
          Selfie
        </li>
        <li className="flex items-center gap-2.5 font-semibold">
          <span className="mx-[5px] size-2 rounded-full bg-warn" />
          Revisión manual
        </li>
      </ul>
      <div className="mt-auto flex flex-col gap-2.5 pb-7">
        <Boton href="/app/subir">Preparar un set mientras</Boton>
        <p className="m-0 text-center text-xs text-muted">Podrás publicar en cuanto te aprobemos</p>
      </div>
    </main>
  );
}

function Rechazada({ motivo }: { motivo: string | null }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg px-7">
      <span className="mt-[140px] grid size-14 place-items-center rounded-full bg-bad-soft text-bad">
        <XIcon weight="bold" size={26} />
      </span>
      <h1 className="m-0 mt-6 font-display text-[28px] leading-[1.1] font-semibold tracking-[-0.01em]">No pudimos verificar tu identidad</h1>
      <p className="m-0 mt-3 text-[15px] leading-normal text-pretty text-muted">
        {motivo ?? "La información no coincidió."} Tus fotos y borradores siguen guardados, pero no se pueden publicar.
      </p>
      <div className="mt-auto flex flex-col gap-2.5 pb-7">
        <Boton variante="secundario" href="mailto:hola@veloo.vip?subject=Verificaci%C3%B3n">
          Escribir al equipo
        </Boton>
      </div>
    </main>
  );
}

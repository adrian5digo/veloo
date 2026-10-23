import type { Metadata } from "next";
import { ID_MEDIO } from "@/lib/medios";
import { bajaValida } from "@/server/correo";
import { supabaseAdmin } from "@/server/supabase";
import { Baja } from "./baja";

export const metadata: Metadata = { title: "Dejar de recibir avisos · Veloo", robots: { index: false } };

/** Link de baja de los correos de aviso. Pide confirmar con un botón: abrir el link no da de baja. */
export default async function Page({ searchParams }: PageProps<"/baja">) {
  const { e, c, t } = await searchParams;
  const valido = typeof e === "string" && typeof c === "string" && typeof t === "string" && ID_MEDIO.test(c) && bajaValida(e, c, t);
  const { data: creadora } = valido ? await supabaseAdmin().from("creadoras").select("nombre, usuario").eq("id", c).maybeSingle() : { data: null };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      {valido && creadora ? (
        <Baja correo={e} creadoraId={c} token={t} nombre={creadora.nombre || creadora.usuario || "esta creadora"} />
      ) : (
        <section className="flex flex-col gap-2.5 px-7 pt-24">
          <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">Este link no funciona</h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            Puede que se haya cortado al copiarlo. Usa el link del correo más reciente o escríbenos a hola@veloo.vip y te damos de baja.
          </p>
        </section>
      )}
    </main>
  );
}

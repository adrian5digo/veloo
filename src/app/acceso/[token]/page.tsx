import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Descargas, Galeria } from "@/components/fan/galeria";
import { Avatar, Boton, DatoCopiable, FilaLista, ZonaCTA } from "@/components/ui";
import { rutaPublica } from "@/lib/links";
import { urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fanActual, fotosDeSet } from "@/server/fan";
import { hashToken } from "@/server/pagos";
import { perfilPublico } from "@/server/publico";
import { supabaseAdmin } from "@/server/supabase";

export const metadata: Metadata = { title: "Tu compra · Veloo", robots: { index: false } };

/**
 * F7 · Desbloqueado, desde el link permanente del correo. El link se liga a ese correo:
 * la marca de agua lo lleva. Un contracargo lo revoca.
 */
export default async function Page({ params, searchParams }: PageProps<"/acceso/[token]">) {
  const { token } = await params;
  const { nuevo, directo } = await searchParams;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound();

  const db = supabaseAdmin();
  const { data: acceso } = await db
    .from("accesos")
    .select("id, correo, revocado_en, sets(id, titulo, creadoras(usuario))")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!acceso?.sets) notFound();

  if (acceso.revocado_en) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg px-6">
        <h1 className="m-0 mt-[120px] font-display text-[28px] leading-[1.15] font-semibold">Este acceso ya no está activo</h1>
        <p className="m-0 mt-3 text-[15px] leading-normal text-pretty text-muted">
          El pago se reclamó con el banco y se devolvió, así que el acceso se cerró. Si fue un error, escríbenos desde el correo de la compra.
        </p>
      </main>
    );
  }

  await db.from("accesos").update({ ultimo_uso_en: new Date().toISOString() }).eq("id", acceso.id);
  const set = acceso.sets;
  const [contenido, perfil, fan] = await Promise.all([
    fotosDeSet(set.id, set.titulo),
    set.creadoras?.usuario ? perfilPublico(set.creadoras.usuario) : null,
    fanActual(),
  ]);
  const otros = perfil?.sets.filter((s) => s.id !== set.id).length ?? 0;
  const fotos = contenido?.fotos ?? [];
  // L3 solo si todavía no tiene cuenta con ese correo.
  const ofrecerCuenta = !fan || fan.correo !== acceso.correo;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 pt-[22px]">
        <span className="grid size-7 flex-none place-items-center rounded-full bg-ok-soft text-ok">
          <CheckIcon weight="bold" size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 truncate text-base font-semibold">{set.titulo} · desbloqueado</h1>
          <p className="m-0 truncate text-xs text-muted">{nuevo ? `También lo enviamos a ${acceso.correo}` : `Ligado a ${acceso.correo}`}</p>
        </div>
      </header>

      <Galeria fotos={fotos} correo={acceso.correo} />
      <div className="flex justify-between px-5 pt-2.5 text-[13px] text-muted">
        <span>
          {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
        </span>
      </div>
      <Descargas fotos={fotos} />
      {directo === "1" && <section className="px-5 pt-5"><h2 className="m-0 text-base font-bold">Guarda tu acceso</h2><p className="mt-2 text-sm text-muted">Copia este enlace privado para volver a tu set sin crear cuenta. No lo compartas.</p><DatoCopiable valor={`${process.env.NEXT_PUBLIC_SITIO_URL || ""}/acceso/${token}`} mostrar="Tu enlace permanente" /></section>}

      <ZonaCTA className="pt-4">
        {perfil && (
          <FilaLista
            className="p-3"
            miniatura={<Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={40} />}
            titulo={perfil.nombre}
            meta={otros === 0 ? "Por ahora es su único set" : otros === 1 ? "1 set más disponible" : `${otros} sets más disponibles`}
            derecha={
              <Boton variante="secundario" href={rutaPublica(perfil.usuario)} className="min-h-11! w-auto! bg-text! px-4! text-sm text-bg! hover:bg-text!">
                Ver más
              </Boton>
            }
          />
        )}
        {ofrecerCuenta && (
          <Boton variante="texto" href={`/cuenta?acceso=${token}`}>
            Guardar mis compras en una cuenta
          </Boton>
        )}
      </ZonaCTA>
    </main>
  );
}

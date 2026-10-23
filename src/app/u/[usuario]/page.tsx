import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BellIcon, ChatCircleIcon, ImagesIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { Aviso } from "@/components/fan/aviso";
import { IconoRed } from "@/components/fan/icono-red";
import { BarraLink, TarjetaSet } from "@/components/fan/piezas";
import { Avatar, Boton, Estado } from "@/components/ui";
import { rutaPublica } from "@/lib/links";
import { urlAvatar } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fecha } from "@/lib/tiempo";
import { fanActual, relacionCon } from "@/server/fan";
import { bloqueadoPorPais, esNuevo, perfilPublico } from "@/server/publico";
import { cobroDirectoPiloto } from "@/server/piloto";

export async function generateMetadata({ params }: PageProps<"/u/[usuario]">): Promise<Metadata> {
  const { usuario } = await params;
  const perfil = await perfilPublico(usuario);
  // Sin descripción ni imagen: la vista previa en Instagram no muestra nada del contenido.
  return { title: perfil ? `${perfil.nombre} · Veloo` : "Veloo", robots: { index: false } };
}

/** F1 · Perfil público. Seguro para el navegador de Instagram: solo miniaturas con velo. */
export default async function Page({ params }: PageProps<"/u/[usuario]">) {
  const { usuario } = await params;
  const perfil = await perfilPublico(usuario);
  if (!perfil || (await bloqueadoPorPais(perfil.id))) notFound();

  const fan = await fanActual();
  const relacion = fan && fan.id !== perfil.id ? await relacionCon(perfil) : null;
  const suscrito = !!relacion?.suscripcion?.activa;
  const puedeEscribir = perfil.mensajesAbiertos && !!relacion && (relacion.compro || suscrito);
  const ofreceSuscripcion = perfil.suscripcionTokens !== null && !(await cobroDirectoPiloto(perfil.id));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <BarraLink usuario={perfil.usuario} menu={`/reportar?creadora=${perfil.usuario}`} />

      <section className="relative mx-5 mt-5 overflow-hidden rounded-[26px] bg-surface-2 px-5 py-6">
        <span aria-hidden className="pointer-events-none absolute -top-10 -right-9 size-36 rounded-full border-[18px] border-accent-soft" />
        <div className="relative flex items-center gap-4">
          <span className="-rotate-3 rounded-full border border-line bg-surface p-1"><Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={64} className="text-[22px]" /></span>
          <div className="min-w-0"><p className="m-0 text-xs font-semibold text-accent-ink">Mi rincón en Veloo</p><h1 className="m-0 mt-1 break-words font-display text-[28px] leading-tight font-semibold">{perfil.nombre}</h1></div>
        </div>
        {perfil.bio && <p className="relative m-0 mt-4 text-sm leading-normal text-muted">{perfil.bio}</p>}
        <p className="relative m-0 mt-4 flex items-center gap-1.5 text-xs text-muted"><ImagesIcon size={16} weight="bold" aria-hidden />{perfil.sets.length} {perfil.sets.length === 1 ? "set para descubrir" : "sets para descubrir"}</p>
        {puedeEscribir && (
          <Boton variante="texto" href={`/mensajes/nueva/${perfil.usuario}`} icono={<ChatCircleIcon weight="bold" size={18} />}>
            Mandarle un mensaje
          </Boton>
        )}
      </section>

      {ofreceSuscripcion && (
        <section className="mx-5 mt-6 flex flex-col gap-3 rounded-[24px] border border-line bg-surface p-[18px]">
          <div>
            <h2 className="m-0 font-display text-xl font-semibold">Suscripción</h2>
            <p className="m-0 mt-1 text-sm leading-normal text-pretty text-muted">
              {perfil.suscripcionTokens} tokens al mes. Ves todos sus sets, los de ahora y los que publique. Cancelas cuando quieras.
            </p>
          </div>
          {suscrito ? (
            <div className="flex items-center justify-between gap-3">
              <Estado tono="ok">Tu suscripción sigue hasta el {fecha(relacion!.suscripcion!.hasta)}</Estado>
              <Boton variante="texto" href={`${rutaPublica(perfil.usuario)}/suscripcion`} className="-mr-3">
                Ver
              </Boton>
            </div>
          ) : (
            <Boton href={`${rutaPublica(perfil.usuario)}/suscripcion`}>Suscribirme</Boton>
          )}
        </section>
      )}

      {perfil.links.length > 0 && (
        <nav aria-label={`Redes de ${perfil.nombre}`} className="flex flex-col gap-2 px-5 pt-6">
          {perfil.links.map((l) => (
            // <a> y no <Link>: sin prefetch, así un clic se cuenta una sola vez.
            <a
              key={l.id}
              href={`/l/${l.id}`}
              className="relative flex min-h-[52px] items-center justify-center rounded-full border border-line bg-surface px-12 text-base font-medium text-text! no-underline"
            >
              <IconoRed red={l.red} className="absolute left-[18px]" />
              <span className="truncate">{l.titulo}</span>
            </a>
          ))}
        </nav>
      )}

      <section className="flex flex-col gap-4 px-5 pt-7">
        <div className="flex items-center justify-between gap-3"><h2 className="m-0 font-display text-[24px] font-semibold">Mis sets</h2><span className="flex items-center gap-1 text-xs text-muted"><LockKeyIcon size={15} weight="bold" aria-hidden />Con velo</span></div>
        {perfil.sets.length === 0 ? (
          <div className="flex items-center gap-4 rounded-[24px] border border-dashed border-line px-5 py-6"><ImagesIcon size={36} weight="bold" className="shrink-0 -rotate-6 text-accent-ink" aria-hidden /><p className="m-0 text-sm text-muted">Todavía no hay sets. Deja tu correo para enterarte del primero.</p></div>
        ) : (
          <><div className="pt-1"><TarjetaSet usuario={perfil.usuario} set={perfil.sets[0]} destacada nuevo={esNuevo(perfil.sets[0].publicadoEn)} /></div>{perfil.sets.length > 1 && <div className="grid grid-cols-2 gap-3">{perfil.sets.slice(1).map((s) => <TarjetaSet key={s.id} usuario={perfil.usuario} set={s} nuevo={esNuevo(s.publicadoEn)} />)}</div>}</>
        )}
      </section>

      {!suscrito && (
        <section className="mx-5 mt-7 mb-8 border-t border-line pt-6">
          <div className="mb-4 flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink"><BellIcon size={22} weight="bold" aria-hidden /></span><div><h2 className="m-0 font-display text-xl font-semibold">El próximo, en tu correo</h2><p className="m-0 text-xs text-muted">Un aviso por set nuevo. Sin cuenta.</p></div></div>
          <Aviso creadoraId={perfil.id} nombre={perfil.nombre} principal={!ofreceSuscripcion && perfil.sets.length === 0} />
        </section>
      )}
    </main>
  );
}

import { ArrowUpRightIcon, CaretLeftIcon, ImagesIcon, InfinityIcon, LockKeyIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarraLink, FilaSet } from "@/components/fan/piezas";
import { Avatar, Boton, Velo, ZonaCTA } from "@/components/ui";
import { precioMXN } from "@/lib/dinero";
import { rutaPublica } from "@/lib/links";
import { urlAvatar, urlVelo } from "@/lib/medios";
import { cuantasFotos, iniciales } from "@/lib/texto";
import { fanActual, relacionCon } from "@/server/fan";
import { bloqueadoPorPais, perfilPublico, setRetirado, type PerfilPublico } from "@/server/publico";
import { cobroDirectoPiloto } from "@/server/piloto";

export async function generateMetadata({ params }: PageProps<"/u/[usuario]/[slug]">): Promise<Metadata> {
  const { usuario } = await params;
  const perfil = await perfilPublico(usuario);
  return { title: perfil ? `${perfil.nombre} · Veloo` : "Veloo", robots: { index: false } };
}

/** F3 · Detalle del set. E5 si ya no está. */
export default async function Page({ params }: PageProps<"/u/[usuario]/[slug]">) {
  const { usuario, slug } = await params;
  const perfil = await perfilPublico(usuario);
  if (!perfil || (await bloqueadoPorPais(perfil.id))) notFound();

  const set = perfil.sets.find((s) => s.slug === slug);
  if (!set) return <NoDisponible perfil={perfil} slug={slug} retirado={await setRetirado(perfil.id, slug)} />;

  const fan = await fanActual();
  const directo = await cobroDirectoPiloto(perfil.id);
  const relacion = fan && fan.id !== perfil.id && set.precio > 0 ? await relacionCon(perfil) : null;
  const incluido = !!relacion?.suscripcion?.activa;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <BarraLink
        usuario={perfil.usuario}
        slug={set.slug}
        borde={false}
        menu={`/reportar?set=${set.id}`}
        izquierda={
          <Link href={rutaPublica(perfil.usuario)} aria-label={`Ver la página de ${perfil.nombre}`} className="-ml-2.5 grid size-11 place-items-center text-text!">
            <CaretLeftIcon weight="bold" size={20} />
          </Link>
        }
      />

      <section className="px-5 pt-2 pb-5">
        <Link href={rutaPublica(perfil.usuario)} className="inline-flex min-h-11 items-center gap-2.5 text-[13px] text-text! no-underline">
          <Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={34} />
          <span><span className="block text-xs text-muted">Un set de</span><span className="font-bold">{perfil.nombre}</span></span>
          <ArrowUpRightIcon size={18} weight="bold" className="ml-1 text-accent-ink" aria-hidden />
        </Link>
        <h1 className="mt-3 mb-0 break-words font-display text-[34px] leading-tight font-semibold">{set.titulo}</h1>
      </section>

      <div className="relative mx-5 flex-none rounded-[26px] border border-line bg-surface p-2">
        <span className="absolute -top-3 right-4 z-10 inline-flex rotate-3 items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-ink"><ImagesIcon size={16} weight="bold" aria-hidden />{cuantasFotos(set.fotos)}</span>
        {set.portadaId ? (
          <Velo
            tamano="grande"
            fuente={{ src: urlVelo(set.portadaId, "grande") }}
            precio={set.precio > 0 ? precioMXN(set.precio) : "Gratis"}
            className="aspect-[5/4] w-full rounded-[22px]"
          />
        ) : (
          <div className="grid aspect-[5/4] w-full place-items-center rounded-[22px] bg-surface-2 text-muted"><LockKeyIcon size={32} weight="bold" aria-label="Vista previa no disponible" /></div>
        )}
        <div className="flex items-center justify-between gap-3 px-2 pt-3 pb-1 text-xs text-muted"><span className="flex items-center gap-1.5"><LockKeyIcon size={16} weight="bold" aria-hidden />Vista previa con velo</span><span>Fotos en alta resolución</span></div>
      </div>

      <section className="mx-6 mt-5 mb-6 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink"><InfinityIcon size={24} weight="bold" aria-hidden /></span>
        <div><h2 className="m-0 text-sm font-bold">{incluido ? "Incluido en tu suscripción" : "Todas las fotos, para ti"}</h2><p className="m-0 mt-0.5 text-[13px] text-muted">{incluido ? "Míralas mientras tu suscripción esté activa." : set.precio === 0 ? "Sin costo. Vuelve a verlas cuando quieras." : "Un solo pago. Vuelve a verlas cuando quieras."}</p></div>
      </section>

      <ZonaCTA className="border-t border-line bg-surface pt-4">
        {incluido ? (
          <>
            <Boton href={`/ver/${set.id}`}>Ver set</Boton>
            <p className="m-0 text-center text-xs text-muted">Incluido en tu suscripción</p>
          </>
        ) : (
          <>
            <Boton href={`${rutaPublica(perfil.usuario, set.slug)}/pagar`}>
              {set.precio > 0 ? `Desbloquear por ${precioMXN(set.precio)}` : "Ver gratis"}
            </Boton>
            <p className="m-0 text-center text-xs text-muted">{set.precio === 0 ? "Sin costo" : directo ? "Pago con tarjeta" : "Pagas con tokens"} · acceso permanente</p>
            {!directo && set.precio > 0 && perfil.suscripcionTokens !== null && (
              <Boton variante="texto" href={`${rutaPublica(perfil.usuario)}/suscripcion`}>
                O todos sus sets por {perfil.suscripcionTokens} tokens al mes
              </Boton>
            )}
          </>
        )}
      </ZonaCTA>
    </main>
  );
}

/** E5 · Link no disponible. Las compras se conservan. */
function NoDisponible({ perfil, slug, retirado }: { perfil: PerfilPublico; slug: string; retirado: boolean }) {
  const otros = perfil.sets.slice(0, 3);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <BarraLink
        usuario={perfil.usuario}
        slug={slug}
        izquierda={
          <Link href={rutaPublica(perfil.usuario)} aria-label="Cerrar" className="-ml-2.5 grid size-11 place-items-center text-muted!">
            <XIcon weight="bold" size={18} />
          </Link>
        }
      />
      <section className="flex flex-col gap-2.5 px-7 pt-16">
        <h1 className="m-0 font-display text-[28px] leading-[1.15] font-semibold">
          {retirado ? `${perfil.nombre} quitó este set` : "Este set no está disponible"}
        </h1>
        <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
          Si ya lo habías comprado, sigue en tu correo y en Mis compras.
          {otros.length > 0 ? " Si no, estos siguen arriba:" : ""}
        </p>
      </section>
      {otros.length > 0 && (
        <section className="flex flex-col gap-2.5 px-5 pt-5">
          {otros.map((s) => (
            <FilaSet key={s.id} usuario={perfil.usuario} set={s} />
          ))}
        </section>
      )}
      <ZonaCTA>
        <Boton variante="secundario" href={rutaPublica(perfil.usuario)}>
          Ver la página de {perfil.nombre}
        </Boton>
      </ZonaCTA>
    </main>
  );
}

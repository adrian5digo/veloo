import { CaretLeftIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
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
  const puntos = Math.min(set.fotos, 5);
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

      <div className="relative mx-4 mt-1 h-[420px] flex-none">
        {set.portadaId ? (
          <Velo
            tamano="grande"
            fuente={{ src: urlVelo(set.portadaId, "grande") }}
            precio={set.precio > 0 ? precioMXN(set.precio) : "Gratis"}
            className="size-full rounded-[24px]"
          />
        ) : (
          <div className="size-full rounded-[24px] bg-surface-2" />
        )}
        {puntos > 1 && (
          <div aria-hidden className="absolute bottom-3.5 left-3.5 flex gap-1.5">
            {Array.from({ length: puntos }, (_, i) => (
              <span key={i} className={i === 0 ? "h-1 w-7 rounded-sm bg-white" : "h-1 w-3 rounded-sm bg-white/50"} />
            ))}
          </div>
        )}
      </div>

      <section className="flex flex-col gap-2 px-6 pt-5">
        <Link href={rutaPublica(perfil.usuario)} className="flex items-center gap-2 text-[13px] text-muted! no-underline">
          <Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={22} className="text-[9px] text-text" />
          {perfil.nombre}
        </Link>
        <h1 className="m-0 font-display text-[26px] font-semibold tracking-[-0.01em]">{set.titulo}</h1>
        <p className="m-0 flex flex-wrap gap-x-4 text-sm text-muted">
          <span>{cuantasFotos(set.fotos)}</span>
          <span>Alta resolución</span>
          <span>Acceso permanente</span>
        </p>
      </section>

      <ZonaCTA className="pt-4">
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

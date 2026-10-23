import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Aviso } from "@/components/fan/aviso";
import { IconoRed } from "@/components/fan/icono-red";
import { BarraLink, FilaSet } from "@/components/fan/piezas";
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

      <section className="flex flex-col items-center gap-2 px-6 pt-7 text-center">
        <Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={84} className="text-[26px]" />
        <h1 className="m-0 mt-1.5 font-display text-[22px] font-semibold tracking-[-0.01em]">{perfil.nombre}</h1>
        {perfil.bio && <p className="m-0 max-w-[260px] text-sm leading-[1.45] text-muted">{perfil.bio}</p>}
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

      <section className="flex flex-col gap-2.5 px-5 pt-6">
        <h2 className="m-0 text-xs font-semibold text-muted">Sets</h2>
        {perfil.sets.length === 0 ? (
          <p className="m-0 text-[15px] text-muted">{perfil.nombre} todavía no publica sets. Deja tu correo y te avisamos.</p>
        ) : (
          perfil.sets.map((s) => <FilaSet key={s.id} usuario={perfil.usuario} set={s} nuevo={esNuevo(s.publicadoEn)} />)
        )}
      </section>

      {!suscrito && (
        <section className="px-5 pt-7 pb-8">
          <Aviso creadoraId={perfil.id} nombre={perfil.nombre} principal={!ofreceSuscripcion && perfil.sets.length === 0} />
        </section>
      )}
    </main>
  );
}

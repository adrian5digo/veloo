import { CaretLeftIcon, PlayIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Compartir } from "@/components/fan/compartir";
import { BotonSeguir } from "@/components/fan/social";
import { Avatar } from "@/components/ui";
import { fondo } from "@/components/ui/veil";
import { cn } from "@/lib/cn";
import { precio } from "@/lib/dinero";
import { rutaPublica } from "@/lib/links";
import { urlAvatar, urlVelo } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { fanActual } from "@/server/fan";
import { bloqueadoPorPais, perfilPublico } from "@/server/publico";
import { supabaseServidor } from "@/server/supabase";

export async function generateMetadata({ params }: PageProps<"/explorar/[usuario]">): Promise<Metadata> {
  const { usuario } = await params;
  const perfil = await perfilPublico(usuario);
  return { title: perfil ? `${perfil.nombre} · Veloo` : "Veloo" };
}

/** S3 · Perfil en el lado social: seguir, contadores y pestañas Sets / Gratis. */
export default async function Page({ params, searchParams }: PageProps<"/explorar/[usuario]">) {
  const { usuario } = await params;
  const { tab } = await searchParams;
  const perfil = await perfilPublico(usuario);
  if (!perfil || (await bloqueadoPorPais(perfil.id))) notFound();

  const supabase = await supabaseServidor();
  const fan = await fanActual();
  const [{ data: contador }, { data: sigue }] = await Promise.all([
    supabase.from("contadores_creadora").select("seguidores").eq("creadora_id", perfil.id).maybeSingle(),
    fan ? supabase.from("seguimientos").select("creadora_id").eq("fan_id", fan.id).eq("creadora_id", perfil.id).maybeSingle() : { data: null },
  ]);

  const gratis = tab === "gratis";
  const sets = perfil.sets.filter((s) => (gratis ? s.precio === 0 : s.precio > 0));
  const seguidores = Number(contador?.seguidores ?? 0);
  const pestana = "py-3 text-center text-sm no-underline";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="px-5 py-2">
        <Link href="/explorar" aria-label="Explorar" className="-ml-2.5 grid size-11 place-items-center text-text!">
          <CaretLeftIcon weight="bold" size={20} />
        </Link>
      </header>

      <section className="flex items-center gap-4 px-5">
        <Avatar iniciales={iniciales(perfil.nombre)} src={urlAvatar(perfil.avatarPath)} tamano={76} className="text-2xl" />
        <div className="flex flex-1 gap-[18px] text-[13px] text-muted">
          <div>
            <b className="block text-[17px] font-semibold text-text">{seguidores}</b>
            {seguidores === 1 ? "seguidor" : "seguidores"}
          </div>
          <div>
            <b className="block text-[17px] font-semibold text-text">{perfil.sets.length}</b>
            {perfil.sets.length === 1 ? "set" : "sets"}
          </div>
        </div>
      </section>

      <section className="px-5 pt-3.5">
        <h1 className="m-0 text-lg font-semibold">{perfil.nombre}</h1>
        {perfil.bio && <p className="m-0 mt-0.5 text-sm leading-[1.45] text-muted">{perfil.bio}</p>}
      </section>

      <div className="grid grid-cols-[1fr_auto] gap-2 px-5 pt-4">
        <BotonSeguir creadoraId={perfil.id} inicial={!!sigue} />
        <Compartir usuario={perfil.usuario} nombre={perfil.nombre} />
      </div>

      <nav className="mt-[18px] grid grid-cols-2 border-b border-line" aria-label="Contenido">
        <Link href={`/explorar/${perfil.usuario}`} aria-current={!gratis ? "page" : undefined} className={cn(pestana, !gratis ? "border-b-2 border-text font-semibold text-text!" : "text-muted!")}>
          Sets
        </Link>
        <Link
          href={`/explorar/${perfil.usuario}?tab=gratis`}
          aria-current={gratis ? "page" : undefined}
          className={cn(pestana, gratis ? "border-b-2 border-text font-semibold text-text!" : "text-muted!")}
        >
          Gratis
        </Link>
      </nav>

      {sets.length === 0 ? (
        <p className="m-0 px-5 pt-6 text-[15px] text-muted">{gratis ? `${perfil.nombre} no tiene sets gratis por ahora.` : "Todavía no hay sets aquí."}</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-3 gap-0.5 p-0.5">
          {sets.map((s) => (
            <li key={s.id}>
              <Link href={rutaPublica(perfil.usuario, s.slug)} className="relative block aspect-square overflow-hidden" aria-label={s.titulo}>
                <div aria-hidden className="absolute -inset-5 blur-[14px]" style={fondo(s.portadaId ? { src: urlVelo(s.portadaId, "mini") } : { placeholder: "ph" })} />
                <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[11px] font-semibold text-white">
                  {s.video && <PlayIcon weight="fill" size={10} />}
                  {s.precio > 0 ? precio(s.precio) : "Gratis"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

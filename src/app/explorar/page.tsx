import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, BarraFan } from "@/components/ui";
import { fondo } from "@/components/ui/veil";
import { urlAvatar, urlVelo } from "@/lib/medios";
import { iniciales } from "@/lib/texto";
import { supabaseServidor } from "@/server/supabase";

export const metadata: Metadata = { title: "Explorar · Veloo" };

/** S2 · Explorar: búsqueda y creadoras con portada desenfocada. */
export default async function Page({ searchParams }: PageProps<"/explorar">) {
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim().slice(0, 40) : "";
  const supabase = await supabaseServidor();

  let consulta = supabase
    .from("creadoras")
    .select("id, usuario, nombre, avatar_path")
    .eq("verificacion", "aprobada")
    .not("usuario", "is", null)
    .limit(40);
  if (busqueda) {
    const patron = `%${busqueda.replace(/[%_,()]/g, "")}%`;
    consulta = consulta.or(`usuario.ilike.${patron},nombre.ilike.${patron}`);
  }
  const { data: creadoras, error } = await consulta;
  if (error) throw error;

  const ids = creadoras.map((c) => c.id);
  const [{ data: contadores }, { data: portadas }] = ids.length
    ? await Promise.all([
        supabase.from("contadores_creadora").select("*").in("creadora_id", ids),
        supabase.from("sets").select("creadora_id, portada_id, publicado_en").in("creadora_id", ids).eq("estado", "publicado").order("publicado_en", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const tarjetas = creadoras
    .map((c) => {
      const k = contadores?.find((x) => x.creadora_id === c.id);
      return {
        ...c,
        seguidores: Number(k?.seguidores ?? 0),
        sets: Number(k?.sets_publicados ?? 0),
        portada: portadas?.find((p) => p.creadora_id === c.id && p.portada_id)?.portada_id ?? null,
      };
    })
    .filter((c) => c.sets > 0)
    .sort((a, b) => b.seguidores - a.seguidores);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <h1 className="m-0 px-5 pt-5 font-display text-[26px] font-semibold tracking-[-0.01em]">Explorar</h1>
      <form action="/explorar" className="relative mx-5 mt-3.5">
        <MagnifyingGlassIcon weight="bold" size={18} className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-muted" />
        <input
          name="q"
          type="search"
          defaultValue={busqueda}
          placeholder="Buscar creadoras"
          aria-label="Buscar creadoras"
          className="min-h-[46px] w-full rounded-full border border-transparent bg-surface-2 pr-[18px] pl-11 text-[15px] text-text outline-none placeholder:text-muted focus:border-accent"
        />
      </form>

      <h2 className="m-0 px-5 pt-[18px] pb-2 text-[13px] font-semibold">{busqueda ? `Resultados para “${busqueda}”` : "En tendencia"}</h2>
      {tarjetas.length === 0 ? (
        <p className="m-0 px-5 text-[15px] text-muted">{busqueda ? "Nadie con ese nombre. Prueba con su usuario, sin @." : "Todavía no hay creadoras con sets publicados."}</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-2.5 px-4 pb-6">
          {tarjetas.map((k) => (
            <li key={k.id}>
              <Link href={`/explorar/${k.usuario}`} className="block overflow-hidden rounded-[22px] border border-line bg-surface text-text! no-underline">
                <div className="relative h-[150px]">
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      aria-hidden
                      className="absolute -inset-[30px] blur-[22px]"
                      style={fondo(k.portada ? { src: urlVelo(k.portada, "mini") } : { placeholder: "ph" })}
                    />
                  </div>
                  <Avatar
                    iniciales={iniciales(k.nombre || k.usuario!)}
                    src={urlAvatar(k.avatar_path)}
                    tamano={40}
                    className="absolute -bottom-4 left-2.5 border-2 border-surface text-xs shadow-[0_0_0_1px_var(--line)]"
                  />
                </div>
                <div className="px-3 pt-[22px] pb-3">
                  <div className="truncate text-sm font-semibold">{k.nombre || k.usuario}</div>
                  <div className="text-xs text-muted">
                    {k.sets === 1 ? "1 set" : `${k.sets} sets`} · {k.seguidores === 1 ? "1 seguidor" : `${k.seguidores} seguidores`}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 mt-auto">
        <BarraFan activa="explorar" />
      </div>
    </main>
  );
}

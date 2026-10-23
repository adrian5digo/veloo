import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonMeGusta } from "@/components/fan/social";
import { Avatar, BarraFan, Boton, Velo } from "@/components/ui";
import { precio } from "@/lib/dinero";
import { rutaPublica } from "@/lib/links";
import { urlAvatar, urlVelo } from "@/lib/medios";
import { cuantasFotos, iniciales } from "@/lib/texto";
import { hace } from "@/lib/tiempo";
import { fanActual, portadasNitidas } from "@/server/fan";
import { haySinLeer } from "@/server/mensajes";
import { supabaseServidor } from "@/server/supabase";

export const metadata: Metadata = { title: "Inicio · Veloo" };

/** S1 · Feed: lo nuevo de las creadoras que sigues. Pagos con velo; gratis sin velo. */
export default async function Page() {
  const fan = await fanActual();
  if (!fan) redirect("/entrar?siguiente=/inicio");
  const supabase = await supabaseServidor();

  const { data: sigo } = await supabase.from("seguimientos").select("creadora_id").eq("fan_id", fan.id);
  const ids = (sigo ?? []).map((s) => s.creadora_id);
  const { data: sets } = ids.length
    ? await supabase
        .from("sets")
        .select("id, slug, titulo, precio_centavos, portada_id, publicado_en, creadoras(id, usuario, nombre, avatar_path)")
        .in("creadora_id", ids)
        .eq("estado", "publicado")
        .order("publicado_en", { ascending: false })
        .limit(30)
    : { data: [] };
  const lista = sets ?? [];
  const setIds = lista.map((s) => s.id);

  const [{ data: medios }, { data: contadores }, { data: mios }] = setIds.length
    ? await Promise.all([
        supabase.from("medios").select("set_id").in("set_id", setIds),
        supabase.from("contadores_set").select("*").in("set_id", setIds),
        supabase.from("me_gusta").select("set_id").eq("fan_id", fan.id).in("set_id", setIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const gratisNitidas = await portadasNitidas(lista.filter((s) => s.precio_centavos === 0).map((s) => s.portada_id));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <header className="flex items-center gap-2.5 px-5 py-4">
        <span className="flex-1 font-display text-lg font-semibold tracking-[-0.01em]">veloo</span>
        <span className="text-[13px] text-muted">Siguiendo</span>
      </header>

      {lista.length === 0 ? (
        <section className="flex flex-col gap-2 px-6 pt-10">
          <h1 className="m-0 font-display text-2xl leading-[1.15] font-semibold">{ids.length ? "Nada nuevo por ahora" : "Aquí sale lo nuevo de quien sigues"}</h1>
          <p className="m-0 text-[15px] leading-normal text-pretty text-muted">
            {ids.length ? "Cuando publiquen un set, aparece aquí primero." : "Sigue a una creadora y sus sets nuevos te llegan aquí, sin depender de Instagram."}
          </p>
          <Boton variante="secundario" href="/explorar" className="mt-4">
            Explorar creadoras
          </Boton>
        </section>
      ) : (
        <div className="flex flex-col gap-[22px] px-4 pb-6">
          {lista.map((s) => {
            const c = s.creadoras!;
            const nombre = c.nombre || c.usuario!;
            const fotos = medios?.filter((m) => m.set_id === s.id).length ?? 0;
            const gratis = s.precio_centavos === 0;
            const nitida = gratis && s.portada_id ? gratisNitidas.get(s.portada_id) : undefined;
            const link = rutaPublica(c.usuario!, s.slug);
            return (
              <article key={s.id} className="flex flex-col gap-2.5">
                <Link href={`/explorar/${c.usuario}`} className="flex items-center gap-2.5 text-sm text-text! no-underline">
                  <Avatar iniciales={iniciales(nombre)} src={urlAvatar(c.avatar_path)} tamano={32} className="text-[11px]" />
                  <b className="font-semibold">{nombre}</b>
                  <span className="text-[13px] text-muted">
                    · {hace(s.publicado_en).replace("hace ", "")}
                    {gratis && " · gratis"}
                  </span>
                </Link>
                {nitida ? (
                  <Link href={link} aria-label={s.titulo} className="block h-[220px] rounded-[26px] bg-cover bg-center" style={{ backgroundImage: `url("${nitida}")` }} />
                ) : (
                  <Link href={link} aria-label={s.titulo}>
                    <Velo
                      tamano="grande"
                      fuente={s.portada_id ? { src: urlVelo(s.portada_id, "grande") } : { placeholder: "ph" }}
                      precio={`${cuantasFotos(fotos)} · ${gratis ? "gratis" : precio(s.precio_centavos / 100)}`}
                      className="h-[300px]"
                    />
                  </Link>
                )}
                {gratis ? (
                  <BotonMeGusta
                    setId={s.id}
                    inicial={!!mios?.some((m) => m.set_id === s.id)}
                    total={Number(contadores?.find((k) => k.set_id === s.id)?.me_gusta ?? 0)}
                  />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="flex-1 text-sm">Set nuevo: {s.titulo}</span>
                    <Link href={link} className="grid min-h-10 place-items-center rounded-full bg-text px-4 text-sm font-semibold text-bg! no-underline">
                      Desbloquear
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-0 mt-auto">
        <BarraFan activa="inicio" sinLeer={await haySinLeer("fan")} />
      </div>
    </main>
  );
}


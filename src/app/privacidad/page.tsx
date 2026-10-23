import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { BarraLegal } from "@/components/legal/barra";
import { Boton, ZonaCTA } from "@/components/ui";

export const metadata: Metadata = { title: "Aviso de privacidad · Veloo" };

// Texto de muestra del diseño (R3). Falta la revisión legal (LFPDPPP) antes de lanzar.
const PUNTOS = [
  { titulo: "Qué guardamos", texto: "Correo y compras. Si eres creadora, también tu INE, tu selfie y tu CLABE." },
  {
    titulo: "Datos biométricos",
    texto: "Tu selfie se usa solo para comprobar tu identidad, se guarda cifrada y se borra 90 días después de cerrar tu cuenta.",
  },
  {
    titulo: "Qué ve la creadora de ti",
    texto: "Tu nombre visible (si pusiste uno) o tu correo enmascarado (f•••@correo.com), qué le compraste y si estás suscrito. Nunca tu correo completo.",
  },
  {
    titulo: "Mensajes",
    texto: "Los guardamos para que la conversación siga ahí. El equipo de Veloo solo los lee si alguno de los dos reporta la conversación, y cada vez queda registrado.",
  },
  {
    titulo: "Avísame",
    texto: "Si dejas tu correo para saber cuándo publica una creadora, lo usamos solo para eso. Ella ve cuántos correos hay, nunca cuáles. Para salir de la lista, escríbenos y lo borramos.",
  },
  { titulo: "Mayoría de edad", texto: "Guardamos la fecha en que confirmaste tener 18 años o más." },
];

/** R3 · Aviso de privacidad. */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg">
      <BarraLegal ruta="privacidad" />
      <div className="flex flex-col gap-1.5 px-6 pt-6">
        <h1 className="m-0 font-display text-[28px] font-semibold">Tus datos</h1>
        <p className="m-0 text-sm leading-normal text-muted">Aviso de privacidad conforme a la LFPDPPP.</p>
      </div>
      <section className="flex flex-col gap-4 px-6 pt-5 text-sm leading-normal">
        {PUNTOS.map((p) => (
          <div key={p.titulo}>
            <h2 className="m-0 text-[15px] font-bold">{p.titulo}</h2>
            <p className="m-0 text-muted">{p.texto}</p>
          </div>
        ))}
      </section>
      <ZonaCTA>
        <Boton variante="secundario" href="/api/mis-datos" prefetch={false} icono={<DownloadSimpleIcon weight="bold" size={20} />}>
          Descargar mis datos
        </Boton>
        <Boton variante="texto" tono="peligro" href="mailto:privacidad@veloo.vip?subject=Borrar%20mi%20cuenta">
          Borrar mi cuenta
        </Boton>
      </ZonaCTA>
    </main>
  );
}

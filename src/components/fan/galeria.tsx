import { MarcaDeAgua } from "@/components/ui";

/** Galería de un set desbloqueado (F7). La primera foto grande; con marca de agua si hay comprador. */
export function Galeria({ fotos, correo }: { fotos: { id: string; vista: string | null }[]; correo?: string }) {
  return (
    <div className="mx-4 mt-4 grid grid-cols-2 gap-1.5">
      {fotos.map((f, i) => (
        <div
          key={f.id}
          role="img"
          aria-label={`Foto ${i + 1}`}
          className={`relative overflow-hidden bg-surface-2 bg-cover bg-center ${i === 0 ? "col-span-2 h-[250px] rounded-[22px]" : "h-[150px] rounded-[14px]"}`}
          style={f.vista ? { backgroundImage: `url("${f.vista}")` } : undefined}
        >
          {correo && <MarcaDeAgua correo={correo} tamano={i === 0 ? 12 : 10} />}
        </div>
      ))}
    </div>
  );
}

/** Links de descarga de los originales (sin EXIF). */
export function Descargas({ fotos }: { fotos: { id: string; descarga: string | null }[] }) {
  if (!fotos.some((f) => f.descarga)) return null;
  return (
    <details className="mx-5 mt-3">
      <summary className="cursor-pointer text-[13px] font-medium text-accent-ink">Descargar</summary>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[13px]">
        {fotos.map((f, i) =>
          f.descarga ? (
            <li key={f.id}>
              <a href={f.descarga}>Foto {i + 1}</a>
            </li>
          ) : null,
        )}
      </ul>
    </details>
  );
}

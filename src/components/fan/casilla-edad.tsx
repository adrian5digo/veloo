/** "Confirmo que tengo 18 años o más". Se pide una vez, antes del primer pago; queda en su cuenta con la fecha. */
export function CasillaEdad({ marcada, onChange }: { marcada: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 pb-1 text-sm leading-[1.45] text-pretty">
      <input type="checkbox" checked={marcada} onChange={(e) => onChange(e.target.checked)} className="mt-px size-5 flex-none accent-accent" />
      Confirmo que tengo 18 años o más. Veloo no es para menores de edad.
    </label>
  );
}

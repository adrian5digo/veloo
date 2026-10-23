const entero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const centavos = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "$149" para precios en listas y botones. */
export function precio(monto: number) {
  return `$${entero.format(monto)}`;
}

/** "$149 MXN" para CTAs y copy. */
export function precioMXN(monto: number) {
  return `${precio(monto)} MXN`;
}

/** "$149.00 MXN" para totales y desgloses. */
export function totalMXN(monto: number) {
  return `$${centavos.format(monto)} MXN`;
}

/** "$3,284.50" para cifras grandes de dinero. */
export function cifra(monto: number) {
  return `$${centavos.format(monto)}`;
}

export const COMISION = 0.4;

/** Lo que recibe la creadora por venta, después del 40%. */
export function netoCreadora(monto: number) {
  const centavos = Math.round(monto * 100);
  return (centavos - Math.round(centavos * COMISION)) / 100;
}

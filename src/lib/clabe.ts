/** Misma regla que public.clabe_valida(): 18 dígitos y dígito de control con pesos 3, 7, 1. */
export function clabeValida(clabe: string) {
  if (!/^[0-9]{18}$/.test(clabe)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(clabe[17]);
}

/** "•••• 4821" */
export const ultimos4 = (clabe: string) => `•••• ${clabe.slice(-4)}`;

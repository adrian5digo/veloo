/** "Vale Ruiz" → "VR"; "valeruiz" → "VA". */
export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/[\s._-]+/).filter(Boolean);
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : nombre.trim().slice(0, 2);
  return letras.toUpperCase();
}

/** "1 foto" / "12 fotos". */
export function cuantasFotos(n: number) {
  return n === 1 ? "1 foto" : `${n} fotos`;
}

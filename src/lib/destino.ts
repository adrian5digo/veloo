/** Solo rutas internas: evita redirigir a otro sitio con ?siguiente=https://… o //otro.com */
export function destinoSeguro(siguiente: unknown, porDefecto = "/app/boveda") {
  return typeof siguiente === "string" && /^\/(?![/\\])/.test(siguiente) ? siguiente : porDefecto;
}

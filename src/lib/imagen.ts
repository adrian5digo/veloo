/**
 * Solo navegador. Reduce una foto a `lado` px y la convierte a JPEG.
 * Resuelve HEIC del iPhone (Safari lo decodifica) y deja la foto bajo el límite de las server actions (1 MB).
 */
export async function reducirJpeg(archivo: Blob, lado: number, calidad = 0.9) {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagen.width * escala);
  canvas.height = Math.round(imagen.height * escala);
  canvas.getContext("2d")!.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  imagen.close();
  return new Promise<Blob>((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo leer la foto"))), "image/jpeg", calidad));
}

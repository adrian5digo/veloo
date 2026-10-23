/** El nombre de acceso es independiente del subdominio público de la creadora. */
export const USUARIO_ACCESO = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

export function normalizarUsuario(valor: string) {
  return valor.trim().toLowerCase();
}

export function errorContrasena(valor: string): string | null {
  if (valor.length < 8) return "Usa una contraseña de al menos 8 caracteres.";
  if (valor.length > 128) return "Usa una contraseña de hasta 128 caracteres.";
  return null;
}

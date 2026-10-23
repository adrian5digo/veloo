/** Errores de las funciones del inbox, en el idioma de quien escribe. Los usan fan y creadora. */
export const ERRORES_MENSAJE: Record<string, string> = {
  mensaje_vacio: "Escribe algo o elige un set.",
  set_no_disponible: "Ese set ya no está publicado. No se envió nada.",
  sin_cuenta_fan: "Entra con tu correo para escribirle.",
  falta_mayoria_edad: "Antes confirma que tienes 18 años o más (te lo pedimos al comprar tokens).",
  texto_invalido: "El mensaje va de 1 a 1,000 letras.",
  mensajes_cerrados: "Por ahora no recibe mensajes. Tu mensaje no se envió.",
  fan_bloqueado: "No es posible escribirle desde esta cuenta.",
  sin_compra: "Puedes escribirle cuando le compres un set o te suscribas.",
  demasiados_mensajes: "Ya mandaste 20 mensajes hoy. Mañana puedes seguir; los de hoy sí llegaron.",
  conversacion_no_encontrada: "No encontramos esta conversación.",
};

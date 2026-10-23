# Changelog

Cambios de Veloo, del más reciente al más antiguo. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### 2026-10-23

#### Crear y compartir un set con menos dudas
- Paso 1: explica qué es un set, cómo agregar fotos, cuál será la portada y que el precio cubre todas las fotos. El campo de nombre pide escribir el título en vez de mostrar «Mazunte» como ejemplo. El botón indica qué falta para continuar.
- Paso 2: «Solo aparezco yo» y «Aparece alguien más» usan la opción grande compartida, con fondo rosa y marca visible al seleccionar. Si falla el guardado, la selección vuelve al valor anterior y se muestra un error. La creadora piloto ve «Publicar mi set»; al terminar llega a su enlace e imagen para compartir.
- La navegación marca en rosa el icono de la pestaña activa. La pantalla final identifica el enlace completo del set, ofrece «Copiar enlace del set» y explica que la historia de Instagram necesita el sticker «Enlace».
- La historia incorpora la portada con un velo irreversible de desenfoque moderado, generado en servidor desde el original privado tras verificar que la creadora es dueña de la portada y que el set está publicado. La imagen descargada nunca incluye la versión nítida ni un enlace privado. La exportación espera a que termine de dibujarse.

#### Comisión del 40%
- Nuevas ventas directas y órdenes atendidas por servidor guardan 40% en centavos; los desbloqueos y renovaciones con tokens usan la migración `20261023064322_comision_cuarenta.sql`. La interfaz, el cálculo previo, Términos y el ejemplo de componentes muestran 40%. Los detalles de ventas anteriores leen la comisión efectivamente guardada, sin cambiar su historial.
- Migración probada localmente con PGlite y aplicada al proyecto Supabase el 23 de octubre (`comision_cuarenta`, versión remota `20261023065126`). Confirmadas las dos funciones con 40%; no cambió el esquema de tipos ni se modificaron ventas pasadas. Pasaron `npm run test:db`, `npm run lint`, TypeScript y la compilación.

### 2026-10-22

#### Pago directo preparado para modo real
- Por solicitud de Adrian, el pago directo de la creadora piloto acepta `sk_live_` además de `sk_test_`. El regreso de Checkout admite sesiones reales y la confirmación exige que su modo coincida con la llave configurada; conserva comprobaciones de orden, importe, moneda, correo, cookie y acceso idempotente.
- El webhook rechaza eventos de otro modo antes de guardarlos. Los paquetes de tokens siguen limitados a prueba; una llave real no habilita su compra ni su acreditación.
- No se guardaron las llaves compartidas en el chat ni se configuraron variables remotas. Para activar: configurar en Vercel `STRIPE_SECRET_KEY` y el `STRIPE_WEBHOOK_SECRET` del destino real `/api/stripe/webhook`, confirmar `NEXT_PUBLIC_SITIO_URL` y desplegar este código. No necesita llave pública para Checkout alojado.
- Este cambio local no confirma aceptación del modelo por Stripe, configuración de correo ni cobros reales. No se efectuó ningún cargo.
- Validación local: 16 pruebas de sesiones de pago y TypeScript correctos. La compilación no pudo completarse por falta de conexión con Google Fonts (Fredoka, Nunito y Geist Mono).

### 2026-10-21

#### Nombre visible del pago
- A petición de Adrian, las nuevas sesiones de pago directo muestran solo `Veloo` como nombre del comercio en Checkout (`branding_settings.display_name`) y como concepto del producto. Sin título del set ni nombre de la creadora en esos dos campos; la vinculación interna con la compra se conserva.
- Se oculta Link en este checkout para quitar la opción adicional de guardar datos que todavía mostraba el nombre anterior del comercio. El pago directo con tarjeta permanece.
- Desplegado en `veloo-vip.vercel.app` (`dpl_E2UGrFzU787yvXGX7SoFkFJfx8Ch`, READY). Compilación y TypeScript correctos. Un despliegue intermedio se canceló por demora en `npm ci`; el reintento terminó usando `npm ci --prefer-offline --no-audit`, sin cambiar dependencias ni lockfile.
- No se modificó el nombre fiscal ni el descriptor bancario. La revisión automática bloqueó el guardado del formulario global de Stripe por incluir otros datos de soporte y legales; se canceló sin guardar y el nombre visible se configura únicamente en la sesión de Checkout.

#### Pago directo para acelerar el piloto
- A petición de Adrian, la creadora habilitada en `creadoras_prueba` ofrece pago directo por set con Stripe Checkout, sin paquetes de tokens ni cuenta obligatoria. Un correo y confirmación de mayoría de edad, tarjeta en Stripe y regreso al contenido. Sigue exclusivamente en modo de prueba; no se habilitaron llaves ni cobros reales.
- El precio y la comisión del 20% se calculan en servidor; la venta usa `ordenes`, `confirmar_pago`, acceso permanente y retención de 7 días existentes. Webhook y regreso verifican sesión, importe, moneda, correo, orden, modo de prueba y estado pagado. La confirmación es idempotente. Eventos fallidos del webhook se pueden reintentar aunque ya estén guardados.
- Compra invitada: token aleatorio en cookie httpOnly del navegador de compra (24 h), solo su hash en Stripe/base. El regreso requiere esa cookie y el pago confirmado. Se ofrece copiar el enlace permanente; no se promete correo transaccional mientras Resend siga sin configurar. Con una sesión del correo comprador, la compra también aparece en Mis compras.
- Se ocultan las ofertas de suscripción con tokens en el perfil público de la creadora piloto. Tokens, saldos y suscripciones anteriores se conservan para otras cuentas. Revertir: desactivar `creadoras_prueba.activa`; las compras directas anteriores mantienen acceso.
- Comprobaciones: pruebas de validación de sesiones de Stripe, suite SQL y compilación de Next.js. La prueba de tarjeta de 100 tokens del historial no constituye una prueba del checkout directo nuevo.
- Desplegado en producción (`dpl_7uPK9s7TwocdtYpT8R7cH9GcAx53`, estado READY), incluido el rediseño de creadora. Alias público confirmado: `https://veloo-vip.vercel.app`.
- **Venta directa probada de extremo a extremo:** set «prueba», tarjeta de prueba Visa terminada en 4242, correo sintético `prueba-directa@example.com`, sin crear cuenta ni comprar tokens. Stripe mostró Entorno de prueba y regresó al set sin velo, con marca de agua y enlace permanente copiable. Orden `7611b71e-2715-44f1-a23c-fed0830e4a55` (folio 2) pagada: $149.00 MXN, comisión $29.80, neto $119.20 retenido 7 días. Verificados un acceso, un movimiento de venta y webhook `checkout.session.completed` procesado con `livemode=false`. Sin cobro real. Evidencia local: `../venta-prueba-confirmada.jpg`.
- Adrian confirmó que él opera la cuenta Stripe «Nay Catillo VIP» y que la creó inicialmente para un solo usuario. Esto documenta quién la opera; no equivale a aprobación de Stripe para cobrar y repartir ventas de terceros.
- **Salida con dinero real:** faltan configuración y webhook en vivo, correo de recuperación de acceso y revisión de los textos/contactos antes de recibir compradores reales. Stripe distingue a una creadora individual de una plataforma que cobra por terceros; no dar por obligatorio Connect para una tienda de contenido propio, ni considerar autorizado repartir cobros de terceros a mano. Referencia: https://stripe.com/mx/legal/restricted-businesses.

#### Excepción temporal para pruebas con una creadora
- Por autorización explícita de Adrian, `naycastillo` (acceso `nay_pecadora`, cuenta `sidebis028…`) queda con identidad aprobada manualmente y publicación sin espera de moderación. No requiere crear una cuenta de staff para el piloto.
- Migración `20261021232249_publicacion_pruebas.sql` aplicada en Supabase: lista privada `creadoras_prueba`, trigger al enviar a moderación y registro `publicaciones_prueba`. Solo se habilitó el ID de esta creadora mediante configuración remota; ninguna cuenta viene habilitada en la migración. Tipos regenerados.
- Set «prueba» publicado y comprobado en remoto. Los siguientes se publican al completar el envío; se conserva la declaración, el procesamiento de medios y las firmas si aparecen otras personas. El velo y el cobro con tokens no cambian.
- **Revertir antes de ampliar el piloto:** poner `activa = false` en `creadoras_prueba` para esta creadora. Los siguientes envíos volverán a moderación; los sets ya publicados se conservan. Revisar manualmente la identidad y los sets de prueba antes del lanzamiento. La publicación por trigger no dispara los correos de aprobación del panel.
- Pruebas SQL: publicación sin staff, auditoría, aislamiento de otras cuentas, permisos privados, declaración y desactivación de la excepción.

#### Diseño de la zona de creadora
- Estructura compartida en `/app`: navegación lateral en escritorio y marca compacta en móvil, con los colores, las fuentes y las formas de la portada. Conserva las pestañas móviles y el aviso de mensajes sin leer.
- Encabezados unificados en Bóveda, Ventas, Mensajes, Perfil y Nuevo set. Bóveda muestra conteos reales de sets, publicados y ventas; los estados pasan debajo del título.
- Vacíos con ilustraciones propias en CSS y Phosphor, instrucciones concretas y acceso al siguiente paso. Se retiran las afirmaciones sin datos sobre precios y ventas de la primera semana.
- Sin cambios en pagos, verificación, moderación ni permisos de medios.

#### Decisión de producto
- **Prueba de concepto con pagos administrados por Adrian:** Adrian llevará los saldos y administrará manualmente los pagos y retiros de las creadoras. No se integrará Stripe Connect para esta etapa. Esta decisión sustituye el pendiente anterior de integrar Connect como siguiente paso del piloto.
- **Estado al cerrar la sesión:** Stripe permanece en modo de prueba; el cobro y la acreditación de tokens ya se probaron de extremo a extremo. No se habilitaron cobros reales ni se modificó la restricción de llaves de prueba del servidor. La aceptación por Stripe del modelo de tokens y pagos manuales no está confirmada; queda pendiente revisarla antes de una operación con dinero real.

#### Configurado
- **Stripe en prueba**, con la cuenta elegida por el propietario: Nay Catillo VIP (`acct_1PqoMgLXAY74bygo`). Guardadas como secretos de producción de Vercel `STRIPE_SECRET_KEY` (solo prueba), `STRIPE_WEBHOOK_SECRET` y `SUPABASE_SECRET_KEY`. Ninguna llave se guarda en el repositorio.
- Webhook `Veloo - tokens de prueba` (`we_1USsvuLXAY74bygoHaYfOOcM`) a `https://veloo-vip.vercel.app/api/stripe/webhook`, con eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` y `checkout.session.expired`. API del destino: `2024-06-20`.
- Despliegue con las variables completado. Probada desde el navegador una compra con tarjeta de prueba de 100 tokens: Checkout confirmó el pago, la compra quedó `pagada` y la pantalla mostró saldo 100 con un movimiento de +100. No hubo cobro de dinero real. OXXO, reembolsos, Connect y pagos en vivo no se probaron.

### 2026-10-20

#### Agregado
- **Acceso con usuario y contraseña**: registro e inicio en `/entrar`, guiones bajos en el nombre de acceso y recuperación por código de correo. `/cuenta/seguridad` permite configurar usuario y contraseña con una sesión válida; accesible desde Perfil. El nombre de acceso es independiente del link público y no modifica sus reglas de subdominio.
- Migración 24 (`acceso_usuario`) aplicada: nombres únicos, reserva atómica al registrarse, RLS y límite de 10 intentos por usuario cada 15 minutos. Función Edge `entrar-usuario` publicada: resuelve el correo solo en servidor y valida la contraseña con Supabase Auth. Tipos regenerados. El cliente no puede enumerar nombres ni consultar correos.
- **Portada nueva** (`/`): composición adaptable con identidad de Veloo, partículas Canvas propias que cambian de candado a sets y token, y demo interactiva de crear, compartir y comprar un set. Solo usa figuras y placeholders ilustrativos, sin fotos de usuarias. Incluye pausa, alternativa sin Canvas, movimiento reducido y suspensión al salir de pantalla o esconder la pestaña. Sin dependencias nuevas.
- Dominio público de producción: `https://veloo-vip.vercel.app`. La URL con el nombre del equipo está protegida por el acceso de Vercel; los links de correo usan ahora el dominio público.
- Proyecto `veloo` en Vercel, en `adrian5digos-projects`, con Next.js, instalación `npm ci` y build `npm run build`. Código subido directamente desde `web/`; todavía no hay remoto Git para despliegues automáticos.
- Configuradas las variables públicas de Supabase, la URL `https://veloo-adrian5digos-projects.vercel.app` y un `CRON_SECRET` generado para Vercel. El proyecto local queda vinculado mediante `.vercel/project.json` (ignorado por Git).

#### Pendiente
- Supabase de servidor y Stripe de prueba configurados el 2026-10-21. Queda completar Resend con su remitente y `CORREO_SECRETO` para correo transaccional.
- Verificar los redirects de Auth de Supabase para la URL desplegada y conectar el dominio propio. No se activaron pagos simulados en producción.

### 2026-10-16

#### Agregado
- **Correos con Resend** (`src/server/correo.ts`), mandados después de responder (`after()`): si un correo falla, la compra o el mensaje no se rompen.
  - **Set nuevo** (al aprobarse en moderación): a la lista de aviso y a los seguidores mayores de 18, una sola vez por set. No le llega a quien ya lo compró, a bloqueados ni a quien se dio de baja.
  - **Mensaje nuevo:** al otro lado de la conversación, máximo un correo cada 3 horas. No copia el texto del mensaje.
  - **Set mandado a un grupo** (C14): un correo por fan que lo recibió, con el mismo límite.
  - **Desbloqueo con tokens:** el link permanente `/acceso/[token]`, que antes no se mandaba.
  - **Tokens acreditados** (webhook de Stripe) y **suscripción detenida** por falta de saldo (cron).
- **Baja de avisos** con link firmado: `/baja` pide confirmar con un botón (los antivirus abren los links) y `/api/baja` atiende el "Darse de baja" de un clic de Gmail (`List-Unsubscribe`).
- **Migración 23** (`avisos_correo`): `bajas_correo`, `sets.avisado_en`, límites por conversación y las funciones que devuelven a quién escribirle (solo el servidor). 12 pruebas nuevas (184 en total).
- Variables nuevas: `RESEND_API_KEY`, `CORREO_REMITENTE`, `CORREO_SECRETO`.

#### Pendiente
- ~~Aplicar la migración 23 en Supabase y regenerar los tipos~~: hecho el 2026-10-20. Verificadas la tabla con RLS, las columnas y los permisos de las cuatro funciones nuevas (solo servidor). Las pruebas de base de datos pasaron.
- Configurar Resend como SMTP de Supabase para el correo de entrada (Authentication → SMTP Settings).

### 2026-10-14

#### Agregado
- **Avísame** en la página de la creadora (F1): quien llega desde una historia deja su correo para enterarse del próximo set, sin cuenta. Funciona aunque todavía no haya sets. La creadora ve cuántos correos hay en Perfil, nunca cuáles. Máximo 10 por hora por IP.
- **Mayoría de edad del fan:** casilla "Confirmo que tengo 18 años o más" antes del primer pago en `/tokens` (y al suscribirse). Se guarda una vez en la cuenta con la fecha (`fans.mayor_edad_en`). Sin eso no se compra, no se suscribe ni se escribe.
- **Suscripción mensual con tokens** (F9 `/u/[usuario]/suscripcion`, C16 `/app/perfil/suscripcion`):
  - La creadora la prende y le pone precio (49 a 2,000 tokens al mes; sugeridos 99, 149 y 199). Comisión 20%, retenido 7 días, igual que un set.
  - El suscriptor ve todos sus sets publicados en `/ver/[set]` (con marca de agua de su correo) mientras siga activa. F3 dice "Ver set · Incluido en tu suscripción" y el desbloqueo no cobra.
  - Se renueva cada mes con el saldo (cron diario `/api/cron/suscripciones`); si no alcanza, se detiene sin cobrar. Se cancela cuando quiera y sigue hasta la fecha pagada. El precio queda fijo para quien ya está suscrito.
  - Aparece en F1, en Mis compras (con su estado) y en los movimientos de tokens. Ventas muestra activas y neto de 30 días.
- **Inbox** entre fan y creadora:
  - Fan (F8 `/mensajes`, nueva pestaña): escribe primero solo si ya le compró o está suscrito, tiene cuenta y confirmó ser mayor de 18. Solo texto, máximo 20 al día. Botón "Mandarle un mensaje" en F1.
  - Creadora (C12 `/app/mensajes`, C13): contesta y adjunta sus sets publicados (llegan con velo y precio; si el fan ya lo tiene o está suscrito, lo abre). Ve el nombre visible del fan o su correo enmascarado, cuántas compras tiene y si está suscrito. Puede cerrar los mensajes en Perfil.
  - **Mandar un set a un grupo** (C14 `/app/mensajes/enviar`): compradores, suscriptores o seguidores. No le llega a quien ya lo tiene ni a bloqueados. Máximo 3 envíos al día.
  - Sin IA: cualquiera de los dos reporta la conversación (motivo nuevo "acoso") y la creadora bloquea desde ahí. El equipo solo lee conversaciones reportadas (`/panel/reportes/[id]`), y cada lectura queda en `registro_staff`.
- **Migraciones 19 a 22** (`valores_nuevos`, `aviso_y_edad`, `suscripciones`, `mensajes`). 71 pruebas nuevas (172 en total).

#### Cambiado
- **Pestañas de la creadora:** Bóveda · Ventas · + · **Mensajes** · Perfil. Retiros se abre desde Ventas. Mensajes usa `chat-circle` (globo de chat), agregado al set aprobado de la sección 04. Punto rosa cuando hay mensajes sin leer.
- **Pestañas del fan:** Inicio · Explorar · Mensajes · Mis compras.
- Términos y Privacidad: mayoría de edad para todo, suscripciones, mensajes y lista de aviso.
- Slugs reservados: `mensajes`, `suscripcion` y `ver`.

#### Quitado
- El código de F2 que quedaba: `confirmarEdad`, `COOKIE_EDAD` y `edadConfirmada()`.

#### Pendiente
- ~~Aplicar las migraciones 19 a 22 y regenerar `database.types.ts`~~: aplicadas el 2026-10-15.
- El linter de Supabase marca `bandeja_creadora` porque lee `auth.users` (solo para el correo enmascarado). Se puede cambiar por una función que devuelva la bandeja.
- `CRON_SECRET` en Vercel para la renovación diaria.
- Los avisos (lista de aviso, set nuevo, mensaje nuevo) todavía no se mandan solos: falta correo transaccional y el envío de push. Para el piloto, el equipo saca los correos de `lista_aviso` en Supabase y los manda a mano, con forma de darse de baja.
- La casilla de edad es una autodeclaración: con OXXO un menor puede pagar en efectivo.

### 2026-10-09

#### Agregado
- **Links de la creadora** (tipo Linktree). En C8 Perfil → **Mis links** (`/app/perfil/links`): agregar con solo pegar el link (el nombre se propone solo: "Instagram", "TikTok"…), editar, subir y bajar, apagar sin borrar y borrar con confirmación. Máximo 20. Cada link muestra sus clics.
  - Se ven en su página pública (`[usuario].veloo.vip`) arriba de los sets, como botones con el ícono de la red: Instagram, TikTok, X, YouTube, Twitch, Spotify, WhatsApp, Telegram, Facebook, Threads o web.
  - Cada botón pasa por `/l/[id]`, que suma el clic y lleva al destino. La URL no viaja en la página.
  - Solo links `https` (se aceptan pegados sin `https://` o con `http://` y se corrigen). Nada de `javascript:` ni `data:`.
- **Migración 17** (`links`): `links_creadora` (la creadora no puede tocar los clics), `abrir_link()` y slugs reservados. 15 pruebas nuevas.

#### Cambiado
- **Subdominio de la creadora:** en `valeruiz.veloo.vip`, las rutas de la app (`/tokens`, `/entrar`, `/mis-compras`…) llevan al dominio principal en vez de buscarse como un set. `/l/…` se sirve en el mismo subdominio.
- La sesión se comparte entre `veloo.vip` y los subdominios (cookie con dominio `.veloo.vip` cuando hay `NEXT_PUBLIC_DOMINIO`): el fan entra una vez.
- Un set ya no puede llamarse como una ruta de la app: un set titulado "Tokens" queda como `tokens-2`.
- El proxy también renueva la sesión en las páginas del subdominio.
- **Chips de sugerencia en rosa:** `<Chips tono="acento">` (activo `--accent-ink` con texto `--on-accent`; inactivo `--accent-soft` con texto `--accent-ink`). Lo usan los precios sugeridos de C4; los filtros siguen neutros. Está en `/sistema` y como regla en `CLAUDE.md`.
- **Veloo ya no tiene contenido para adultos** (sigue siendo solo para mayores de 18):
  - Se quitó F2 (aviso +18). El fan entra directo al set y a desbloquear.
  - F1 ya no dice "Al tocar un set te pediremos confirmar tu edad".
  - F3 dice "Pagas con tokens · acceso permanente" en vez de "tarjeta, OXXO o SPEI".
  - C1 dice "Para vender necesitas tener 18 años o más": las creadoras siguen verificando su edad con la INE.
  - En C4b, la creadora también confirma que no hay desnudos ni contenido sexual.
  - Los Términos prohíben desnudos y contenido sexual, aunque vayan con velo. Piden 18 años o más para vender o comprar tokens.
  - R1 tiene el motivo "Tiene desnudos o contenido sexual". No es urgente: no oculta el set hasta que alguien lo revise.
- **Migración 18** (`sin_contenido_sexual`): motivo de rechazo `contenido_sexual`, y `contenido_prohibido` ahora nombra los desnudos. Aplicada en Supabase.
- Migraciones 15, 16 y 17 aplicadas en Supabase y `database.types.ts` regenerado (los tipos de links ya no van a mano).

#### Pendiente
- ~~Aplicar la migración 17 y regenerar `database.types.ts`~~: aplicada el 2026-10-09.
- ~~Edad mínima de 18 años para todos: casilla en `/tokens`~~: hecho el 2026-10-14.
- ~~Borrar `confirmarEdad`, `COOKIE_EDAD` y `edadConfirmada()`~~: hecho el 2026-10-14.
- Para producción: en Vercel, dominio comodín `*.veloo.vip`, y `NEXT_PUBLIC_SITIO_URL=https://veloo.vip`.

### 2026-10-08

#### Agregado
- **Tokens** (1 token = $1 MXN) para desbloquear sets. Veloo deja de tener contenido para adultos: con eso Stripe sí acepta la cuenta.
  - `/tokens`: saldo, paquetes de 100, 250 y 500, compra con Stripe Checkout y movimientos. Al volver de Stripe muestra si el pago se confirmó, sigue pendiente (OXXO) o falló.
  - F4 ahora es **Desbloquear**: cuánto cuesta el set en tokens, cuántos tienes y cuántos te quedan o te faltan. Sin sesión pide entrar; sin saldo manda a comprar y regresa al set. Si ya lo tenías, va directo a verlo sin cobrar.
  - Webhook `/api/stripe/webhook`: verifica la firma, guarda cada evento una sola vez y acredita solo si la sesión, el monto y la moneda coinciden con la compra.
  - Mis compras muestra el saldo con acceso a `/tokens`. Ventas y Métricas reconocen el método "Tokens".
  - Migraciones 15 y 16: método `tokens`, `compras_tokens`, `movimientos_tokens` (el saldo es la suma, nunca un número guardado), `mi_saldo_tokens`, `acreditar_tokens()` (solo servidor, idempotente) y `desbloquear_con_tokens()` (fan con sesión; no deja gastar el mismo saldo dos veces ni cobra dos veces el mismo set). La venta de la creadora queda igual que con cualquier pago: neto después del 20%, retenido 7 días. 19 pruebas nuevas.
- **SPEI manual**, para validar con dinero real mientras no hay procesador. Se activa con `SPEI_CLABE` y `SPEI_TITULAR` y entonces es el único método del checkout. En F6 el fan ve la CLABE de Veloo, el titular, el banco y un **concepto único** por compra (`VLO` + 5 caracteres, sin 0/O ni 1/I/L), con botón de copiar.
- **Panel · Pagos** (`/panel/pagos`): cola de transferencias por confirmar. Se busca por concepto, monto o correo. "Recibido" pide confirmar el monto antes de marcar el pago. Crea el acceso y la venta (retenida 7 días) igual que un webhook, y queda registrado quién confirmó.
- **Migración 14** (`spei_manual`): concepto único entre órdenes de SPEI manual, columna `confirmada_por` y `confirmar_spei_manual()`, que solo puede usar el servidor y exige a alguien del equipo. 10 pruebas nuevas (82 en total).

#### Cambiado
- Una orden de SPEI manual vencida todavía se puede confirmar: si el fan transfirió tarde con su concepto, no pierde la compra. E3 lo dice así en vez de prometer un reembolso automático.
- "Recibimos tu pago" ya no dice que el acceso llegó al correo (todavía no hay correo transaccional): manda a Mis compras con el correo de la compra.
- El checkout solo muestra los métodos del procesador activo. La leyenda `VLO*DIGITAL` solo aparece con tarjeta.

#### Pendiente
- **Antes de cobrar en vivo con Stripe:** integrar Connect para pagar a las creadoras (Stripe prohíbe cobrar a tu nombre por lo que venden terceros y repartirlo a mano) y confirmar con soporte de Stripe que acepta los tokens ("créditos virtuales" están en su lista de negocios restringidos). Por eso el servidor solo acepta llaves `sk_test_`.
- ~~Quitar F2 (aviso +18), los textos de "+18" y ajustar Términos y motivos de rechazo~~: hecho el 2026-10-09.
- El checkout por set (`checkout.tsx`) y el SPEI manual ya no se usan para comprar sets; el panel de pagos sigue funcionando para órdenes que ya existan. Se pueden reconectar para comprar tokens por transferencia.
- Reembolsos de tokens: si Stripe reembolsa una compra, todavía no se descuentan los tokens.
- ~~Aplicar las migraciones 15 y 16~~: aplicadas el 2026-10-09.
- Con SPEI manual, el fan no recibe aviso cuando se confirma: entra a Mis compras con su correo. Los retiros a las creadoras se siguen pagando a mano.

### 2026-10-07

#### Agregado
- **Proyecto de Supabase conectado** (`mmbvcwuktchqlxuorpot`). Servidor MCP de Supabase con scope de proyecto en `.mcp.json`, y `web/.env.local` con la URL y la publishable key.
- **Migraciones aplicadas** en el proyecto real, más la 10 (`permisos_funciones`): las funciones de trigger ya no se pueden llamar por `/rest/v1/rpc` y `es_staff()` no la ejecuta `anon`.
- **Tipos de la base** en `src/lib/database.types.ts`, generados desde Supabase. Los clientes del servidor (`supabaseServidor`, `supabaseAdmin`) ya están tipados. Hay que regenerarlos después de cada migración.
- **C4b Consentimiento** (`/app/sets/[id]/consentimiento`): "¿Aparece otra persona?", link de firma por persona, estado de cada firma, casilla de declaración y envío a revisión con `enviar_a_moderacion()`. El botón se bloquea hasta tener la declaración y todas las firmas. Si el set fue rechazado, muestra el motivo exacto (E4).
- **C3 Bóveda** (`/app/boveda`): grid de 2 columnas con filtros, estado sobre la miniatura, precio y ventas. Las miniaturas tienen velo y se ven nítidas solo al mantener presionado. Bóveda vacía (E1) con "Subir mi primer set".
- **Migraciones 11 a 13:** slug del set para el link público (no cambia aunque se edite el título), los 5 motivos de rechazo con el texto del diseño, y los motivos de reporte "contenido robado" y "datos personales". 75 pruebas del esquema.
- **Creadora, alta:** C1 Bienvenida (`/`), C1b Registro (link `[usuario].veloo.vip` con disponibilidad en vivo y fecha de nacimiento, mayor de 18), C2 y C2b (INE frente, reverso y selfie al bucket privado `identidad`) y C2c En revisión.
- **Creadora, publicar:** C5 Publicado (`/app/sets/[id]`): link copiable y la historia H1–H4 en 4 estilos, dibujada en canvas a 1080×1920. "Compartir en Instagram" copia el link y abre la hoja de compartir con la imagen; "Guardar imagen" la descarga.
- **Creadora, perfil:** C8 Perfil (link, notificaciones, datos fiscales, bloquear países, cerrar sesión), C9 Editar perfil (foto procesada en servidor sin EXIF, bio de 120, cambio de link cada 90 días) y las subpantallas de datos fiscales y países.
- **Creadora, dinero:** C6 Ventas (Hoy / Semana / Mes, neto, barras, métodos, por link), C11 Detalle de venta (correo enmascarado, retención, bloquear fan), C7 Retiros (`solicitar_retiro()`) y C10 CLABE (banco por los 3 primeros dígitos, titular de la INE, confirmación por correo y pausa de 24 h).
- **Fan:** F1 Perfil público (`/u/[usuario]`, o `[usuario].veloo.vip` con `NEXT_PUBLIC_DOMINIO`), F2 Aviso +18 (cookie de 30 días), F3 Detalle con velo, E5 Link no disponible, F4 Checkout, E2 Tarjeta rechazada, F5 OXXO, F6 SPEI, E3 Ficha vencida, F7 Desbloqueado (marca de agua con el correo) por link permanente (`/acceso/[token]`) y desde Mis compras, y L3 Cuenta de fan.
- **Pagos:** interfaz `Procesador` en `src/server/pagos.ts`. Mientras no haya procesador, uno simulado (`PAGOS_SIMULADOS=1`, solo desarrollo) permite probar el flujo completo: venta, retención, saldo y acceso.
- **Social:** S1 Feed (`/inicio`), S2 Explorar con búsqueda, S3 Perfil con Seguir / Siguiendo y pestañas Sets / Gratis, y S4 Mis compras. Los sets gratis se ven completos sin pago.
- **PWA:** manifest "Bóveda" con candado neutro (P4), service worker, P1 Abrir en navegador (dentro de Instagram), P2 Instalar (iPhone / Android) y P3 Avisos (suscripción web push).
- **Reportes y legales:** R1 Reportar (sin cuenta, folio, los urgentes ocultan el set al momento, máximo 5 por hora por IP), R2 Términos, R3 Privacidad con "Descargar mis datos".
- **Panel interno** (`/panel`, solo personal en la tabla `staff`): A1 Moderación (cola, galería sin velo con registro de acceso, personas y firmas, motivos fijos, atajos A / R / J), A2 Verificaciones (INE y selfie, aprobar con el nombre de la INE, pedir otra foto, rechazar), A3 Métricas y A4 Reportes.

#### Cambiado
- Al guardar el borrador, C4 lleva directo a C4b (paso 2 de 2).
- Después de entrar, la creadora llega a la bóveda (`/app` redirige a `/app/boveda`). Sin link todavía, pasa primero por el registro y la verificación.
- La pestaña "Inicio" del fan apunta a `/inicio`; `/` es la bienvenida de la creadora.

#### Corregido
- La plantilla del correo de entrada ignoraba a dónde regresar (`siguiente` fijo). Ahora usa `{{ .RedirectTo }}`; ver `supabase/configuracion.md`.
- `/auth/confirmar` rompía los destinos con query (`?c=…&t=…`) al ponerlos como pathname.

#### Pendiente
- El link de firma (`/firmar/[token]`) se genera pero la página todavía no existe: depende del proveedor de verificación de identidad (INE + selfie). Por ahora la creadora copia el link; no se manda por SMS ni WhatsApp.
- En la bóveda, los sets ocultos (por reporte urgente o firma retirada) se muestran como "Oculto". Ese estado no está en el sistema de diseño; falta definir su copy.
- Sin correo transaccional: el acceso de compra, la ficha OXXO y el resumen no se mandan por correo. La confirmación de CLABE usa el correo de entrada de Supabase. "Enviarla a mi correo" (F5) no está.
- Videos: C4v y S5 esperan la decisión de video (ffmpeg o proveedor de streaming).
- Avisos: se guarda la suscripción, falta enviarlos desde el servidor (web-push con llaves VAPID).
- Correos de contacto usados en la interfaz (`hola@veloo.vip`, `privacidad@veloo.vip`) son provisionales.

### 2026-10-06

#### Agregado
- **Esquema completo de base de datos** en 9 migraciones (`supabase/migrations/`): cuentas, verificación de identidad, contenido y consentimiento, compras, dinero, social, moderación con reportes, y storage. Diagrama y reglas en `supabase/esquema.md`.
- Reglas que hace cumplir la base de datos:
  - **Sets:** la publicación exige declaración, firmas de quienes aparecen y creadora verificada. La creadora solo cambia el estado con `enviar_a_moderacion()` y `retirar_set()`. Un reporte urgente o una firma retirada ocultan el set.
  - **Dinero:** el saldo es un libro de movimientos. Cada venta queda retenida 7 días, el contracargo descuenta el neto y revoca el acceso, y `confirmar_pago()` es idempotente.
  - **Retiros:** mínimo $200, uno a la vez, sin pasar del saldo disponible, y pausados 24 h tras cambiar la CLABE. La CLABE se valida con su dígito de control y un banco del catálogo.
  - **Subdominio:** se cambia cada 90 días como máximo y hay nombres reservados.
- **Vistas que enmascaran datos sensibles** para el navegador: `mis_ventas` (correo `f•••@`), `mi_cuenta_bancaria` (`•••• 5678`), `personas_de_mis_sets`, `mis_bloqueos`, `mi_saldo` y `mis_compras`.
- **Pruebas del esquema** en Postgres en memoria (PGlite): `npm run test:db`, 66 pruebas.

#### Cambiado
- La tabla `fotos` pasa a llamarse `medios` y admite video (duración, vista previa). El procesamiento marca la foto como `procesando` de forma atómica, para que dos peticiones no procesen la misma foto.
- Los correos se guardan en minúsculas, con un check en la base. Reemplaza a `citext`, cuyas comparaciones distinguían mayúsculas según el `search_path`.

#### Corregido
- Un fan que compró con mayúsculas en el correo no veía su compra.
- El bloqueo de un fan no lo detectaba si el correo traía mayúsculas.

### 2026-10-05

#### Agregado
- **Proyecto Next.js 16** (App Router, TypeScript, Tailwind v4) en `web/`. Las reglas de diseño se copiaron como `CLAUDE.md` en la raíz.
- **Tokens del sistema de diseño** en `globals.css`, con modo oscuro (`[data-tema="oscuro"]`), y las fuentes Fredoka, Nunito y Geist Mono.
- **Componentes** en `src/components/ui/`: botones, campos, dato copiable, chips, segmentado, opción grande, toggle, estados, fila de lista, velo, velo revelable (mantener presionado), marca de agua, marco móvil, logo, avatar y barras de pestañas. Se ven juntos en `/sistema`.
- **C4 Nuevo set** (`/app/subir`): subida de fotos con progreso, título, precio con sugeridos y neto después de la comisión del 20%. "Continuar" guarda el set como borrador.
- **Velo generado en el servidor** con sharp: la foto se reduce a 12 px y se agranda desenfocada, de modo que no se puede revertir. El navegador nunca recibe la versión nítida antes de pagar. Además se genera una original limpia (sin EXIF/GPS) y una vista nítida que solo ve la dueña, con un link firmado de 60 s.
- **Integración con Supabase:**
  - Login con link mágico y código de 6 dígitos (L1), y pantalla de link vencido (L2) en `/entrar`.
  - Proxy que renueva la sesión y protege `/app`.
  - Subida directa del navegador a Storage con link firmado, para no pasar por el límite de 4.5 MB de Vercel.
- Guía de configuración en `supabase/configuracion.md` y variables en `.env.example`.

---

## Próximos pasos

Actualizado el 2026-10-09. **Veloo deja de tener contenido para adultos** (pero sigue siendo solo para mayores de 18) y cobra con Stripe: el fan compra tokens y desbloquea sets con ellos. Lo de CCBill, la LLC en EE. UU. y el SPEI manual queda en el historial de arriba (2026-10-07 y 2026-10-08) por si se retoma.

Para probar en local (lo que falta de tu lado):
1. `SUPABASE_SECRET_KEY` en `.env.local`.
2. Cuenta de Stripe en modo de prueba (México): `STRIPE_SECRET_KEY=sk_test_…`, y OXXO activado en Payment methods si se quiere.
3. Stripe CLI (`winget install Stripe.StripeCli`, `stripe login`); `stripe listen --forward-to localhost:3100/api/stripe/webhook` da el `STRIPE_WEBHOOK_SECRET`.
4. En Supabase: `http://localhost:3100/auth/confirmar**` en Redirect URLs y la plantilla de correo de `supabase/configuracion.md`.
5. Entrar una vez en `/entrar`, darse de alta en `staff` y recorrer: registro, verificación, subir, consentimiento, moderación, comprar tokens, desbloquear, ventas y links.

Para lanzar, en orden:
1. **Stripe Connect** para pagar a las creadoras. Stripe no permite cobrar a tu nombre lo que venden terceros y repartirlo a mano. Reemplaza C7 Retiros y C10 CLABE.
2. **Confirmar con soporte de Stripe que acepta los tokens** ("créditos virtuales" está en su lista de negocios restringidos): plataforma de creadoras no adulta, tokens de circuito cerrado, pagos con Connect.
3. **INE** (con dos testigos si no hay otra identificación) y RFC: Stripe México los pide para activar la cuenta en vivo. No hace falta empresa.
4. **Correo transaccional** (Resend o Postmark): avisos de compra y de tokens acreditados. El SMTP de Supabase no alcanza para producción.
5. **Firma de consentimiento de terceros** (`/firmar/[token]`).
6. **Revisión legal** de Términos y Privacidad (hoy son textos de muestra), y un contador por la retención de ISR e IVA a las creadoras que pide el SAT a las plataformas.
7. **Dominio:** `veloo.vip` y `*.veloo.vip` en Vercel, con `NEXT_PUBLIC_DOMINIO=veloo.vip` y `NEXT_PUBLIC_SITIO_URL=https://veloo.vip`.

Puede esperar después del lanzamiento:
- Reembolsos de tokens (descontarlos si Stripe reembolsa una compra).
- Comprar tokens por SPEI manual (el código de 2026-10-08 se puede reconectar).
- Proveedor de verificación de identidad. Con pocas creadoras alcanza la verificación manual del panel.
- Video (C4v, S5): ffmpeg o proveedor de streaming. Para archivos de hasta 4 GB hace falta el plan Pro de Supabase.
- Envío de avisos push (web-push con llaves VAPID).

**Decisiones pendientes:**
- Copy del estado "Oculto" en la bóveda.
- Correos de contacto definitivos (hoy `hola@veloo.vip` y `privacidad@veloo.vip`).
- Cómo funcionan los comentarios.
- Si se borran el checkout por set y el SPEI manual, o se reconectan para comprar tokens.
- SMTP propio antes de lanzar.

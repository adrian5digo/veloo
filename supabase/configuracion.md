# Configurar Supabase para Veloo

## Acceso con contraseña (20 de octubre de 2026)

- La migración `20261021013329_acceso_usuario.sql` añade `usuarios_acceso` e `intentos_acceso`, con RLS. La CLI generó el timestamp en UTC. Los nombres existentes de creadoras se reservan como nombres de acceso; no se crean contraseñas para esas cuentas.
- Desplegar `supabase/functions/entrar-usuario/index.ts` con la configuración de `config.toml`. Esta función valida usuario y contraseña con Auth y devuelve solo los tokens de sesión. Usa las variables de Supabase ya disponibles en Edge (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); ninguna se copia al navegador. No requiere JWT previo porque implementa el propio inicio de sesión.
- El registro usa `signUp` y exige confirmar el correo según la configuración de Auth. Incluir `https://veloo-vip.vercel.app/auth/confirmar**` en los redirects permitidos y configurar la Site URL de producción. La app conserva código y link de correo como alternativa.
- `/cuenta/seguridad` permite configurar una contraseña para una cuenta existente o recuperarla después de entrar con un código. El nombre admite guiones bajos y es independiente del subdominio del perfil público.
- La cuenta de Auth no omite el registro de fecha de nacimiento ni la verificación de identidad de la creadora. Las contraseñas nunca se guardan en las tablas públicas.

## Configuración inicial

1. **Crear el proyecto** en supabase.com (región más cercana a México: `us-east-1` o `us-west-1`).
2. **Esquema:** en el SQL Editor, correr **en orden** cada archivo de `migrations/` (del `…100_base` al `20261007…400_motivos_reporte`). Con la CLI: `supabase link` y luego `supabase db push`. Qué crea cada uno: ver `esquema.md`.
3. **Llaves:** Project Settings → API Keys. Copiar `.env.example` a `.env.local` y llenar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable / anon)
   - `SUPABASE_SECRET_KEY` (secret / service_role, solo servidor)
4. **Auth → URL Configuration:**
   - Site URL: `http://localhost:3100` (en producción, el dominio real).
   - Redirect URLs: agregar `http://localhost:3100/auth/confirmar**` (con `**`: el link lleva `?siguiente=…`).
5. **Auth → Providers → Email:** dejar activo "Email", y "Email OTP Expiration" en `900` (15 min, como dice el diseño).
6. **Auth → Email Templates → Magic Link:** para que el link use la ruta del servidor, regrese a donde estaba la persona (`{{ .RedirectTo }}` ya trae `/auth/confirmar?siguiente=…`) y traiga el código de respaldo:

   ```html
   <h2>Entra a Veloo</h2>
   <p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Entrar</a></p>
   <p>O escribe este código: <b>{{ .Token }}</b></p>
   <p>Dura 15 minutos y sirve una sola vez.</p>
   ```

7. **Correo de producción:** el SMTP incluido de Supabase manda pocos correos por hora y solo sirve para pruebas. Antes de lanzar, configurar un SMTP propio (Resend, Postmark…) en Auth → SMTP Settings.

8. **Personal interno (panel `/panel`):** no hay pantalla para dar de alta al equipo. Después de entrar una vez con tu correo, en el SQL Editor:

   ```sql
   insert into public.staff (id, rol, nombre)
   select id, 'admin', 'Tu nombre' from auth.users where email = 'tu@correo.com';
   ```

9. **Variables opcionales** (ver `.env.example`):
   - `PAGOS_SIMULADOS=1`: solo en desarrollo. Activa un procesador de prueba para comprar sin cobrar (tarjeta, OXXO y SPEI) y un botón "Simular que se pagó" en las fichas. En producción no hace nada.
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: llave pública para los avisos (P3). Sin ella, la pantalla de avisos dice que todavía no están disponibles. Falta el envío desde el servidor.
   - `NEXT_PUBLIC_DOMINIO`: en producción, `veloo.vip` (los perfiles viven en `[usuario].veloo.vip`). Necesita un dominio comodín (`*.veloo.vip`) apuntando al proyecto.

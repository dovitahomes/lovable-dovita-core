# Supabase Email Templates

Este documento contiene las plantillas HTML para los correos de Supabase que deben configurarse en el panel de administración.

## Configuración en Supabase

1. Ve a **Authentication → Email Templates** en tu proyecto de Supabase
2. Copia y pega las plantillas correspondientes
3. Configura las URLs de redirección en **Authentication → URL Configuration**:
   - **Invite / Magic Link**: `https://TU_DOMINIO/auth/callback`
   - **Reset Password**: `https://TU_DOMINIO/auth/reset`

---

## 1. Invite User / Magic Link

**Ubicación**: Authentication → Email Templates → **Invite user** / **Magic Link**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;line-height:1.5;color:#111">
  <h2 style="margin:0 0 12px">¡Bienvenido(a) a Dovita!</h2>
  <p>Te invitamos a acceder a tu cuenta y ver la información de tus proyectos.</p>
  <p>Haz clic en el botón para continuar:</p>
  <p style="margin:24px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0038A8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Entrar a Dovita</a>
  </p>
  <p style="font-size:12px;color:#555">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>{{ .ConfirmationURL }}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#666">Si no esperabas este correo, puedes ignorarlo.</p>
</div>
```

---

## 2. Reset Password

**Ubicación**: Authentication → Email Templates → **Reset password**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;line-height:1.5;color:#111">
  <h2 style="margin:0 0 12px">Restablecer contraseña</h2>
  <p>Solicitaste cambiar tu contraseña en Dovita.</p>
  <p>Haz clic en el botón para crear una nueva contraseña:</p>
  <p style="margin:24px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0038A8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Crear nueva contraseña</a>
  </p>
  <p style="font-size:12px;color:#555">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>{{ .ConfirmationURL }}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#666">Si no solicitaste este cambio, ignora este correo.</p>
</div>
```

---

## 3. Email Change

**Ubicación**: Authentication → Email Templates → **Change email address**

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;line-height:1.5;color:#111">
  <h2 style="margin:0 0 12px">Confirmar cambio de correo</h2>
  <p>Solicitaste cambiar tu correo electrónico en Dovita.</p>
  <p>Haz clic en el botón para confirmar el cambio:</p>
  <p style="margin:24px 0">
    <a href="{{ .ConfirmationURL }}" style="background:#0038A8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">Confirmar cambio</a>
  </p>
  <p style="font-size:12px;color:#555">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>{{ .ConfirmationURL }}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#666">Si no solicitaste este cambio, ignora este correo y tu cuenta permanecerá segura.</p>
</div>
```

---

## Notas Importantes

1. **Variables disponibles**:
   - `{{ .ConfirmationURL }}` - URL de confirmación/acción generada por Supabase
   - `{{ .Token }}` - Token de verificación (útil para OTP)
   - `{{ .Email }}` - Email del usuario
   - `{{ .SiteURL }}` - URL base de tu aplicación

2. **Color primario**: `#0038A8` (azul Dovita)

3. **Configuración de URLs**: Asegúrate de que las redirect URLs estén configuradas tanto en el ambiente de desarrollo como en producción:
   - Development: `http://localhost:5173/auth/callback` y `/auth/reset`
   - Production: `https://TU_DOMINIO/auth/callback` y `/auth/reset`

4. **Rate limiting**: Supabase tiene límites de envío de correos. Para testing, considera habilitar "Disable email confirmation" temporalmente.

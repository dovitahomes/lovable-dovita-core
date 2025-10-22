# Instrucciones para Crear Usuario Admin

## ✅ Método Seguro (Recomendado)

Se ha creado un Edge Function seguro que crea usuarios admin sin comprometer las políticas RLS.

### Pasos:

1. **Desplegar el Edge Function**
   - El edge function `create-admin-user` se desplegará automáticamente
   - Espera unos segundos para que esté disponible

2. **Llamar al Edge Function desde la consola del navegador**
   
   Abre la consola del navegador (F12) en tu aplicación y ejecuta:

   ```javascript
   await window.createDovitaAdmin();
   ```

   Esto creará el usuario admin con los siguientes datos:
   - **Email:** eugenioguca@hotmail.com
   - **Password:** Test1234$
   - **Nombre:** Administrador Secundario Dovita
   - **Rol:** admin

3. **Verificar el resultado**
   
   La consola mostrará un resumen como:
   ```json
   {
     "auth_user_id": "uuid-del-usuario",
     "email": "eugenioguca@hotmail.com",
     "full_name": "Administrador Secundario Dovita",
     "role": "admin",
     "created_or_updated": "created",
     "rls_unchanged": true,
     "message": "Admin user created successfully..."
   }
   ```

4. **Iniciar sesión**
   
   El usuario ya puede iniciar sesión en `/auth` con las credenciales:
   - Email: eugenioguca@hotmail.com
   - Password: Test1234$

---

## 🔒 Seguridad Garantizada

- ✅ **RLS intactas**: Todas las políticas de seguridad permanecen sin cambios
- ✅ **Sin registro público**: No se habilitó ningún flujo de signup
- ✅ **Service Role Key**: Las operaciones usan privilegios administrativos
- ✅ **Validación**: El edge function requiere una clave secreta
- ✅ **Roles correctos**: El usuario se crea con rol "admin" en `user_roles`

---

## 📋 Verificación Post-Creación

1. El usuario puede iniciar sesión
2. Tiene acceso a todos los módulos (Dashboard, Proyectos, Herramientas, etc.)
3. Puede acceder a "Herramientas → Identidades" para gestionar otros usuarios
4. Puede acceder a "Herramientas → Reglas" para configurar reglas de negocio
5. Las políticas RLS siguen funcionando correctamente

---

## 🗑️ Eliminar el Edge Function (Opcional)

Una vez creado el usuario admin, puedes eliminar el edge function por seguridad:

```bash
# Desde la terminal (si tienes Supabase CLI)
supabase functions delete create-admin-user
```

O simplemente borra la carpeta:
```
supabase/functions/create-admin-user/
```

---

## 🆘 Troubleshooting

**Error: "Invalid secret key"**
- Verifica que el código esté usando la clave correcta: `dovita-admin-setup-2025`

**Error: "User already exists"**
- El edge function actualizará el usuario existente automáticamente
- Verifica el mensaje `created_or_updated` en la respuesta

**Error de red**
- Verifica que el edge function esté desplegado
- Revisa los logs en Supabase Dashboard → Edge Functions → Logs

**El usuario no puede iniciar sesión**
- Verifica que `email_confirm` esté en `true`
- Verifica que la contraseña sea correcta
- Revisa que el rol "admin" exista en `user_roles`

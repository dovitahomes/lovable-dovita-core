# Checklist - Fase 0 Pre-Requisitos

## 📋 Objetivo de Fase 0

Preparar el sistema base para la implementación de RLS, asegurando que:
- Los módulos admin funcionen correctamente
- Existan funciones helper para validar permisos
- Los permisos estén sembrados para usuarios existentes
- Haya documentación y procedimientos de rollback

---

## ✅ Criterios de Aceptación

### 1. Corrección de `/herramientas/identidades`

- [ ] Ya NO intenta leer de tabla `users` (que no existe)
- [ ] Lee correctamente de vista `vw_users_with_roles`
- [ ] Crea registros en `profiles` al invitar usuario nuevo
- [ ] Crea registros en `user_metadata` con sucursal y fecha_nacimiento
- [ ] Usa RPC `admin_set_user_roles()` para asignar roles
- [ ] Formulario de edición actualiza `profiles` + `user_metadata`
- [ ] **Testing:** Crear usuario nuevo y verificar que se crea correctamente
- [ ] **Testing:** Editar usuario existente y verificar cambios

---

### 2. Re-habilitación de `UserRoleBadges`

- [ ] Componente `UserRoleBadges.tsx` ya NO está deshabilitado
- [ ] Llama a `supabase.rpc("admin_set_user_roles", ...)`
- [ ] Solo admins pueden ejecutar la función (validación en backend)
- [ ] Maneja correctamente toggle de múltiples roles
- [ ] Muestra toasts de éxito/error apropiados
- [ ] **Testing:** Asignar rol a usuario en `/herramientas/usuarios`
- [ ] **Testing:** Remover rol a usuario
- [ ] **Testing:** Verificar que no-admin recibe error al intentar

---

### 3. Migración de Base de Datos

#### 3.1 Funciones RPC Creadas
- [ ] `admin_set_user_roles(uuid, text[])` existe y funciona
- [ ] `user_can_access_project(uuid, uuid)` existe
- [ ] `user_has_module_permission(uuid, text, text)` existe
- [ ] `update_user_metadata_updated_at()` trigger existe

#### 3.2 Tabla `user_metadata`
- [ ] Tabla creada con campos: user_id, sucursal_id, fecha_nacimiento, last_login_at
- [ ] RLS habilitado (sin políticas por ahora)
- [ ] Índices creados en user_id y sucursal_id
- [ ] Trigger de updated_at funciona

#### 3.3 Siembra de Permisos
- [ ] Todos los usuarios con rol `admin` tienen permisos completos
- [ ] Usuarios con rol `colaborador` tienen permisos según `module_permissions`
- [ ] Usuarios con rol `cliente` tienen permisos limitados
- [ ] **Verificación SQL:**
  ```sql
  SELECT 
    u.email,
    ur.role_name,
    COUNT(up.module_name) as permisos_asignados
  FROM profiles u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN user_permissions up ON u.id = up.user_id
  GROUP BY u.email, ur.role_name;
  ```
  Debe mostrar permisos para TODOS los usuarios existentes.

---

### 4. Documentación de Rollback

- [ ] Archivo `docs/emergency-rollback.sql` creado
- [ ] Contiene función `emergency_disable_all_rls()`
- [ ] Incluye scripts por fase (Fase 0, 1, 2, 3, 4)
- [ ] Queries de verificación post-rollback incluidas
- [ ] Archivo `docs/RLS_EMERGENCY_PROCEDURES.md` creado
- [ ] Procedimientos claros de cuándo usar rollback
- [ ] Diagnóstico de problemas comunes incluido
- [ ] Checklist post-rollback incluido

---

## 🧪 Plan de Testing

### Testing en Staging

1. **Test de Invitación de Usuario:**
   ```
   - Ir a /herramientas/identidades
   - Hacer clic en "Nuevo Usuario"
   - Llenar formulario completo (nombre, email, rol, sucursal, fecha_nacimiento)
   - Verificar que se crea en `profiles`, `user_metadata`, `user_roles`
   - Verificar que se siembran permisos en `user_permissions`
   - Verificar email de invitación recibido
   ```

2. **Test de Edición de Usuario:**
   ```
   - Seleccionar usuario existente
   - Editar nombre, teléfono, rol, sucursal
   - Guardar
   - Verificar cambios en `profiles` y `user_metadata`
   - Verificar que rol se actualiza correctamente
   ```

3. **Test de Asignación de Roles:**
   ```
   - Ir a /herramientas/usuarios
   - Hacer clic en badges de roles de un usuario
   - Alternar roles (admin, colaborador, cliente)
   - Verificar que se guardan correctamente
   - Verificar que permisos se actualizan automáticamente
   ```

4. **Test de Funciones Helper:**
   ```sql
   -- Probar user_can_access_project
   SELECT user_can_access_project(
     'USER_ID_COLABORADOR'::uuid,
     'PROJECT_ID_EXISTENTE'::uuid
   );
   
   -- Probar user_has_module_permission
   SELECT user_has_module_permission(
     'USER_ID_COLABORADOR'::uuid,
     'presupuestos',
     'view'
   );
   ```

5. **Test de Rollback de Emergencia:**
   ```sql
   -- Ejecutar en staging
   SELECT emergency_disable_all_rls();
   
   -- Verificar que RLS está deshabilitado
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND rowsecurity = true;
   
   -- Re-habilitar manualmente para continuar testing
   ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;
   ```

---

## 🔍 Verificación de Linter

Después de Fase 0, ejecutar linter y verificar:

```bash
# Número de issues ANTES de Fase 0: 75
# Número de issues DESPUÉS de Fase 0: ~70 (esperado)
```

**Issues que DEBEN resolverse en Fase 0:**
- ❌ Ninguno (Fase 0 no activa RLS, solo prepara)

**Issues que se resolverán en fases posteriores:**
- 65 tablas sin RLS → Fase 1, 2, 3
- 10 vistas SECURITY DEFINER → Fase 1

---

## 📊 Métricas de Éxito

- [ ] 0 errores al crear usuario nuevo
- [ ] 0 errores al editar usuario existente
- [ ] 100% de usuarios existentes con permisos sembrados
- [ ] Función `admin_set_user_roles()` funciona sin errores
- [ ] Rollback de emergencia funciona correctamente
- [ ] Documentación completa y clara

---

## 🚀 Siguiente Paso

Después de completar y verificar Fase 0:

**Proceder con Fase 1:** Habilitar RLS en tablas críticas (budgets, invoices, bank_accounts)

---

**Fecha de Inicio Fase 0:** 2025-01-07  
**Fecha Estimada de Finalización:** 2025-01-08  
**Responsable:** Equipo de Desarrollo Dovita Core

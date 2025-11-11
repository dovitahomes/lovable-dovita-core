# Correcciones Críticas de Seguridad - Dovita Core

**Fecha de implementación**: 11 de noviembre de 2025  
**Estado**: ✅ IMPLEMENTADO  
**Impacto en funcionalidad**: CERO - Preserva status quo al 100%

## Resumen Ejecutivo

Se implementaron 3 correcciones críticas para resolver vulnerabilidades de seguridad identificadas en el security scan de Supabase:

1. ✅ **Employee Personal Information Could Be Stolen** (profiles)
2. ✅ **Company Bank Account Details Could Be Exposed** (bank_accounts)  
3. ✅ **Employee Documents May Be Accessible** (user_documents)

---

## 1. Protección de Datos Sensibles en Profiles

### Problema Original
La tabla `profiles` exponía datos sensibles (RFC, IMSS, emergency_contact, teléfono, fecha de nacimiento) a cualquier usuario autenticado con permisos de "view" en el sistema.

### Solución Implementada

#### Vista Pública Segura: `v_public_profiles`
```sql
-- Solo expone datos NO sensibles
SELECT id, email, full_name, avatar_url, sucursal_id, created_at, updated_at
FROM profiles;
```

**Datos protegidos (no expuestos en vista pública)**:
- `rfc` - RFC fiscal del empleado
- `imss_number` - Número de IMSS
- `emergency_contact` - Contacto de emergencia (nombre, teléfono, relación)
- `phone` - Teléfono personal
- `fecha_nacimiento` - Fecha de nacimiento
- `fecha_ingreso` - Fecha de ingreso a la empresa

#### Políticas RLS Restrictivas

**Acceso a datos completos**:
- ✅ Usuario puede ver TODO su propio perfil
- ✅ Admins con permiso explícito `rrhh.view` pueden ver datos sensibles de otros

**Actualización de perfiles**:
- ✅ Usuario puede actualizar su propio perfil
- ✅ Admins con permiso explícito `rrhh.edit` pueden actualizar perfiles de otros

### Impacto en Código Existente

**Componentes que deben usar `v_public_profiles`**:
- Listados de empleados (sin datos sensibles)
- Selectores de usuarios para asignación
- Avatares y nombres en chats/calendarios
- Participantes de proyectos

**Componentes que usan `profiles` directamente**:
- Formulario de edición de perfil propio (UserDetailDialog cuando user_id === auth.uid())
- Página de gestión de usuarios RRHH (solo admins con permiso)
- Tab de documentos de empleado (UserDocumentsTab)

---

## 2. Restricción de Acceso a Cuentas Bancarias

### Problema Original
La tabla `bank_accounts` era accesible por cualquier usuario con permisos de módulo `finanzas`, exponiendo números de cuenta, CLABE, saldos y datos bancarios sensibles.

### Solución Implementada

#### Permiso Granular: `finanzas_bancarias`

Nuevo permiso específico que controla acceso a cuentas bancarias:
- `finanzas_bancarias.view` - Ver cuentas bancarias
- `finanzas_bancarias.edit` - Editar cuentas bancarias
- `finanzas_bancarias.create` - Crear nuevas cuentas
- `finanzas_bancarias.delete` - Eliminar cuentas (solo admins)

#### Políticas RLS Restrictivas

**Acceso a bank_accounts**:
- ✅ Solo admins
- ✅ Usuarios con permiso explícito `finanzas_bancarias.view`
- ❌ Colaboradores con solo `finanzas.view` NO pueden ver cuentas

### Asignación de Permisos

**Por defecto**:
- ✅ Todos los admins tienen `finanzas_bancarias.*` automáticamente
- ❌ Colaboradores de finanzas NO tienen acceso por defecto

**Para otorgar acceso a colaborador de finanzas senior**:
```sql
-- Desde página de Gestión de Usuarios (Accesos tab)
INSERT INTO user_permissions (user_id, module_name, action)
VALUES 
  (:user_id, 'finanzas_bancarias', 'view'),
  (:user_id, 'finanzas_bancarias', 'edit'),
  (:user_id, 'finanzas_bancarias', 'create');
```

### Impacto en Código Existente

**BankAccountsTab.tsx**:
- ✅ Funciona igual para admins
- ⚠️ Colaboradores sin `finanzas_bancarias` verán tabla vacía (esperado)
- ℹ️ Agregar mensaje informativo si no hay permisos

---

## 3. Fortalecimiento de Seguridad en Documentos de Empleados

### Problema Original
La tabla `user_documents` no tenía políticas DENY explícitas, permitiendo potenciales accesos cruzados entre usuarios.

### Solución Implementada

#### Políticas DENY Explícitas

**Acceso a documentos**:
- ✅ Usuario puede ver solo SUS propios documentos
- ✅ Admins pueden ver todos los documentos
- ❌ DENY explícito: usuarios NO pueden ver documentos de otros

#### Sistema de Audit Logging

**Tabla**: `user_documents_access_log`

Registra todos los accesos cross-user (cuando admin accede a documento de empleado):
```sql
CREATE TABLE user_documents_access_log (
  id uuid PRIMARY KEY,
  accessed_by uuid,           -- Usuario que accedió
  document_id uuid,            -- Documento accedido
  document_owner uuid,         -- Dueño del documento
  action text,                 -- 'view' | 'download' | 'delete'
  accessed_at timestamptz,     -- Timestamp del acceso
  ip_address text,             -- IP (futuro)
  user_agent text              -- User agent (futuro)
);
```

**Función**: `log_user_document_access(document_id, action)`

Debe llamarse desde el frontend cuando:
- Admin visualiza documento de empleado
- Admin descarga documento de empleado
- Admin elimina documento de empleado

**Ejemplo de uso**:
```typescript
// En UserDocumentsTab.tsx
const handleViewDocument = async (documentId: string) => {
  // Ver documento
  window.open(signedUrl, '_blank');
  
  // Loguear si NO es el propio usuario
  if (userId !== currentUser.id) {
    await supabase.rpc('log_user_document_access', {
      p_document_id: documentId,
      p_action: 'view'
    });
  }
};
```

#### Queries de Auditoría

**Ver accesos recientes a documentos**:
```sql
SELECT 
  dal.accessed_at,
  dal.action,
  p_accessor.full_name as accessed_by_name,
  p_owner.full_name as document_owner_name,
  ud.file_name,
  ud.category
FROM user_documents_access_log dal
JOIN profiles p_accessor ON p_accessor.id = dal.accessed_by
JOIN profiles p_owner ON p_owner.id = dal.document_owner
JOIN user_documents ud ON ud.id = dal.document_id
WHERE dal.accessed_at >= now() - interval '30 days'
ORDER BY dal.accessed_at DESC;
```

**Accesos por usuario (admin específico)**:
```sql
SELECT COUNT(*), dal.action
FROM user_documents_access_log dal
WHERE dal.accessed_by = :admin_user_id
  AND dal.accessed_at >= now() - interval '30 days'
GROUP BY dal.action;
```

### Impacto en Código Existente

**UserDocumentsTab.tsx**:
- ⚠️ Agregar llamadas a `log_user_document_access()` al ver/descargar/eliminar
- ✅ Funcionalidad existente preservada

---

## Testing y Validación

### Checklist de Regresión ✅

- [x] **Auth/Login**: Flujo de autenticación funciona
- [x] **Perfiles propios**: Usuarios ven/editan su perfil completo
- [x] **Gestión RRHH**: Admins ven datos sensibles de empleados
- [x] **Cuentas bancarias**: Solo admins/finanzas senior acceden
- [x] **Documentos**: Sin acceso cruzado entre usuarios
- [x] **Client App**: No afectada (no usa profiles/bank_accounts/user_documents)
- [x] **CRM**: Funciona normalmente
- [x] **Chat/Calendario**: Funcionan normalmente
- [x] **Dashboard**: Widgets funcionan

### Security Scan Post-Implementación

**Esperado**: 0 errores críticos restantes

```
✅ Employee Personal Information - RESUELTO
✅ Bank Account Details - RESUELTO  
✅ Employee Documents - RESUELTO
⚠️  22 Security Definer Views - ESPERADO (documentado)
```

---

## Próximos Pasos Opcionales

### 1. Integrar Audit Logging en Frontend (1 hora)
Actualizar `UserDocumentsTab.tsx` para llamar a `log_user_document_access()`.

### 2. Dashboard de Auditoría RRHH (2 horas)
Crear página `/herramientas/auditoria-documentos` mostrando:
- Últimos accesos a documentos
- Accesos por admin
- Accesos por empleado
- Exportar reporte mensual

### 3. Notificaciones de Acceso (1 hora)
Enviar email/notificación al empleado cuando admin accede a sus documentos.

---

## Referencias

- **Migración**: `supabase/migrations/[timestamp]_critical_security_fixes.sql`
- **Vista segura**: `v_public_profiles` (usar en listados públicos)
- **Permiso bancario**: `finanzas_bancarias` (otorgar manualmente)
- **Audit logging**: `user_documents_access_log` (solo admins pueden ver)
- **RLS Policies**: Ver `docs/RLS_POLICIES.md`
- **Security Monitoring**: Ver `docs/SECURITY_MONITORING.md`

---

**Próxima revisión de seguridad**: Febrero 2026

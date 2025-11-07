# Sistema de Permisos Granulares - Dovita Core

## 📋 Descripción General

Sistema de control de acceso basado en permisos por módulo, que permite definir de forma granular qué acciones puede realizar cada usuario en cada sección de la aplicación.

## 🏗️ Arquitectura

### **1. Tablas de Permisos**

```sql
-- Tabla principal de permisos
user_permissions (
  id uuid,
  user_id uuid,              -- FK a auth.users
  module_name text,          -- Clave del módulo (ej: 'accesos', 'proveedores')
  can_view boolean,          -- Permiso de lectura
  can_create boolean,        -- Permiso de creación
  can_edit boolean,          -- Permiso de edición
  can_delete boolean,        -- Permiso de eliminación
  unique(user_id, module_name)
)
```

### **2. Hooks Frontend**

**`useModuleAccess()`** - Hook principal para verificación de permisos:
```typescript
const { loading, perms, canView, can } = useModuleAccess();

// Verificar si puede ver un módulo
if (canView('accesos')) {
  // Mostrar contenido
}

// Verificar acciones específicas
if (can('proveedores', 'edit')) {
  // Habilitar edición
}
```

### **3. Guardias de Ruta**

**`<ProtectedRoute>`** - Componente para proteger rutas:
```tsx
<Route path="/herramientas/accesos" element={
  <ProtectedRoute moduleName="accesos">
    <Accesos />
  </ProtectedRoute>
} />
```

**Comportamiento:**
- ✅ Usuario sin permisos → Mensaje "Acceso Denegado"
- ✅ Sidebar oculta automáticamente módulos sin permiso
- ✅ Carga progresiva (3s timeout de seguridad)

### **4. RLS Policies Backend**

```sql
-- Ejemplo: Solo admins pueden ver user_permissions
CREATE POLICY "admin_can_view_permissions"
ON user_permissions FOR SELECT
TO authenticated
USING (current_user_has_role('admin'));
```

## 📦 Módulos Protegidos

### **Gestión (Herramientas)**

| Módulo | Ruta | Permisos Típicos | Roles Permitidos |
|--------|------|------------------|------------------|
| **usuarios** | `/herramientas/usuarios` | view, create, edit | admin |
| **identidades** | `/herramientas/identidades` | view, create, edit | admin |
| **accesos** | `/herramientas/accesos` | view, edit | admin |
| **sucursales** | `/herramientas/sucursales` | view, create, edit, delete | admin, colaborador* |
| **centro_reglas** | `/herramientas/reglas` | view, edit | admin |
| **contenido_corporativo** | `/herramientas/contenido-corporativo` | view, edit | admin, colaborador* |
| **herramientas** (Alianzas) | `/herramientas/alianzas` | view, create, edit, delete | admin |

\* Solo con permisos explícitos asignados

### **Otros Módulos Clave**

| Módulo | Ruta | Control de Acceso |
|--------|------|-------------------|
| **proveedores** | `/proveedores` | view, create, edit, delete |
| **ordenes_compra** | `/ordenes-compra` | view, create, edit |
| **lotes_pago** | `/lotes-pago` | view, create, edit |
| **cronograma** | `/gantt` | view |
| **construccion** | `/construccion` | view, create, edit |

## 🧪 Testing Manual

### **Test 1: Admin - Acceso Total** ✅

**Escenario:** Usuario admin debe tener acceso completo  
**Usuario:** `e@dovitahomes.com` (rol: admin)

1. Login como admin
2. Navegar a `/herramientas/accesos` → ✅ Permite acceso
3. Navegar a `/herramientas/identidades` → ✅ Permite acceso
4. Navegar a `/herramientas/usuarios` → ✅ Permite acceso
5. Sidebar muestra todos los módulos de Gestión → ✅ Visible

**Criterio de Aceptación:**
- ✅ Sin mensajes "Acceso Denegado"
- ✅ Todos los botones de acción habilitados
- ✅ `useModuleAccess()` devuelve `canView(module) === true`

---

### **Test 2: Colaborador - Acceso Denegado** ❌

**Escenario:** Colaborador SIN permisos NO puede acceder a herramientas  
**Usuario:** Crear colaborador sin permisos a "accesos"

1. Crear usuario con rol `colaborador`
2. NO asignar permisos a módulo "accesos" en `user_permissions`
3. Login como colaborador
4. Intentar navegar a `/herramientas/accesos` → ❌ "Acceso Denegado"
5. Sidebar NO muestra "Accesos" → ✅ Oculto correctamente

**Criterio de Aceptación:**
- ❌ Alert rojo con ShieldX icon
- ✅ Mensaje: "No tienes permisos para acceder a este módulo"
- ✅ Sidebar filtrado (no muestra módulos sin permiso)

---

### **Test 3: Colaborador - Acceso Parcial (Solo Lectura)** 🔍

**Escenario:** Colaborador con permiso `view` pero sin `edit`  
**Usuario:** Colaborador con `can_view: true, can_edit: false` en "identidades"

1. Asignar permiso en `user_permissions`:
   ```sql
   INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
   VALUES ('<colaborador_id>', 'identidades', true, false, false, false);
   ```
2. Login como colaborador
3. Navegar a `/herramientas/identidades` → ✅ Permite acceso
4. Intentar editar usuario → ❌ Botones deshabilitados
5. Verificar `can('identidades', 'edit')` → ❌ `false`

**Criterio de Aceptación:**
- ✅ Puede ver listado de identidades
- ❌ Botón "Editar" deshabilitado o no visible
- ❌ Botón "Nuevo Usuario" deshabilitado
- ✅ Toast de error si intenta mutación

---

### **Test 4: Cliente - Sin Acceso Backoffice** 🚫

**Escenario:** Clientes NO pueden acceder a herramientas administrativas  
**Usuario:** Cliente con proyecto asignado

1. Login como cliente (rol: `cliente`)
2. Intentar navegar a `/herramientas/accesos` → ❌ Redirige a `/client/dashboard`
3. Sidebar NO muestra sección "Gestión" → ✅ Correcto
4. Verificar `useModuleAccess()` devuelve permisos vacíos → ✅ `perms.length === 0`

**Criterio de Aceptación:**
- ❌ Cliente nunca accede a `/herramientas/*`
- ✅ Redirigido a Client App (`/client/*`)
- ✅ `user_permissions` vacío para clientes

---

## 🔧 Gestión de Permisos

### **Desde la Interfaz**

**Ruta:** `/herramientas/accesos`

1. Seleccionar usuario en el dropdown
2. Matriz de permisos muestra todos los módulos
3. Checkboxes para `Ver | Crear | Editar | Eliminar`
4. Cambios se guardan automáticamente en `user_permissions`

**Componente:** `<PermissionMatrix userId={selectedUserId} />`

### **Desde SQL (Casos Especiales)**

```sql
-- Dar acceso completo a un colaborador en "proveedores"
INSERT INTO user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES ('<user_id>', 'proveedores', true, true, true, true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET can_view = true, can_create = true, can_edit = true, can_delete = true;

-- Remover todos los permisos de un usuario
DELETE FROM user_permissions WHERE user_id = '<user_id>';

-- Ver permisos actuales de un usuario
SELECT module_name, can_view, can_create, can_edit, can_delete
FROM user_permissions
WHERE user_id = '<user_id>'
ORDER BY module_name;
```

## 🛡️ Seguridad Backend (RLS)

### **Políticas Críticas**

```sql
-- user_permissions: Solo admins pueden modificar permisos
CREATE POLICY "admin_can_modify_permissions"
ON user_permissions FOR ALL
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

-- user_roles: Solo admins pueden cambiar roles
CREATE POLICY "admin_can_modify_roles"
ON user_roles FOR ALL
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

-- Helper function para verificar roles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION current_user_has_role(role_name app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = role_name
  )
$$;
```

## 📊 Estado de Implementación

### **Completado ✅**

- [x] Tabla `user_permissions` con RLS habilitado
- [x] Hook `useModuleAccess()` con timeout de 3s
- [x] Componente `<ProtectedRoute>` funcional
- [x] Rutas de `/herramientas/*` protegidas
- [x] Filtrado de sidebar por permisos
- [x] Componente `<PermissionMatrix>` reactivado
- [x] Perfil admin completo (`full_name` actualizado)
- [x] Módulos definidos en `modules.ts`

### **Pendiente 🔄**

- [ ] Testing automatizado (Playwright)
- [ ] Logs de auditoría de cambios de permisos
- [ ] UI para copiar permisos entre usuarios
- [ ] Plantillas de permisos por rol ("Contable", "Diseñador", etc.)

## 🚨 Troubleshooting

### **"Acceso Denegado" aunque soy admin**

1. Verificar que tienes el rol en `user_roles`:
   ```sql
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```
2. Si no existe, agregar:
   ```sql
   INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'admin');
   ```

### **Permisos no se actualizan**

1. Invalidar cache de React Query:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ["user-module-permissions"] });
   ```
2. Verificar que `<PermissionMatrix>` recibe `userId` correcto
3. Revisar logs de consola para errores de RLS

### **Sidebar muestra módulos sin permiso**

1. Verificar que `useModuleAccess()` se llama en `<AppSidebar>`
2. Asegurarse que `loading === false` antes de renderizar
3. Confirmar que `canView(moduleName)` se usa para filtrar

## 📝 Convenciones

- **Nombres de módulos:** snake_case (`centro_reglas`, `contenido_corporativo`)
- **Permisos por defecto:** `false` (denegar por defecto)
- **Timeout de carga:** 3 segundos (luego usa permisos vacíos)
- **Roles en enum:** `app_role` ('admin', 'colaborador', 'cliente', 'accountant')

## 🔗 Referencias

- **Código principal:** `src/routes/ProtectedRoute.tsx`
- **Hook de permisos:** `src/hooks/useModuleAccess.ts`
- **Definición de módulos:** `src/config/modules.ts`
- **Gestión de permisos:** `src/pages/herramientas/Accesos.tsx`
- **Matriz de permisos:** `src/components/admin/PermissionMatrix.tsx`

---

**Última actualización:** 2025-11-07  
**Autor:** Sistema Dovita Core  
**Estado:** ✅ Sistema en Producción

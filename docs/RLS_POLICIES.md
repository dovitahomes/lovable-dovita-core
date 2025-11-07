# Sistema de Roles, Permisos y RLS - Dovita Core

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Roles del Sistema](#roles-del-sistema)
3. [Permisos por Módulo](#permisos-por-módulo)
4. [Funciones de Seguridad](#funciones-de-seguridad)
5. [Políticas RLS por Tabla](#políticas-rls-por-tabla)
6. [Guía de Testing](#guía-de-testing)
7. [Troubleshooting](#troubleshooting)

---

## Arquitectura General

El sistema de seguridad de Dovita Core utiliza tres capas de protección:

1. **Roles** (`user_roles`): Define el tipo de usuario (admin, colaborador, contador, cliente)
2. **Permisos** (`user_permissions`): Permisos granulares por módulo (view, create, edit, delete)
3. **RLS Policies**: Políticas de Row-Level Security en Supabase que filtran datos a nivel de base de datos

### Flujo de Verificación

```
Usuario autenticado
  ↓
¿Tiene rol asignado? (user_roles)
  ↓
¿Tiene permiso de módulo? (user_permissions)
  ↓
¿Cumple con policy RLS? (pg_policies)
  ↓
Acceso concedido
```

---

## Roles del Sistema

### `admin`
- **Descripción**: Administrador del sistema
- **Acceso**: Total a todos los módulos y funcionalidades
- **Sembrado automático**: El primer usuario en registrarse se convierte en admin

### `colaborador`
- **Descripción**: Personal interno (arquitectos, supervisores, project managers)
- **Acceso**: Proyectos asignados + módulos operativos
- **Limitaciones**: No puede ver finanzas ni contabilidad

### `contador`
- **Descripción**: Personal de finanzas y contabilidad
- **Acceso**: Solo módulos financieros (finanzas, contabilidad, lotes de pago)
- **Limitaciones**: No puede ver presupuestos detallados ni construcción

### `cliente`
- **Descripción**: Cliente final del proyecto
- **Acceso**: Solo su proyecto vía Client Portal
- **Limitaciones**: Solo lectura, datos filtrados (sin costos, proveedores, etc.)

---

## Permisos por Módulo

| Módulo | admin | colaborador | contador | cliente |
|--------|-------|-------------|----------|---------|
| **CRM** |
| leads | CRUD | CR-- | ---- | ---- |
| clientes | CRUD | CRUD | ---- | ---- |
| **Proyectos** |
| proyectos | CRUD | CRUD | ---- | R--- |
| diseno | CRUD | CRUD | ---- | R--- |
| presupuestos | CRUD | CRUD | ---- | R--- (filtrado) |
| cronograma | CRUD | CRUD | ---- | R--- |
| construccion | CRUD | CRUD | ---- | R--- |
| **Abastecimiento** |
| proveedores | CRUD | CRUD | R--- | ---- |
| ordenes_compra | CRUD | CRUD | ---- | ---- |
| lotes_pago | CRUD | ---- | CRUD | ---- |
| **Finanzas** |
| finanzas | CRUD | ---- | CRUD | ---- |
| contabilidad | CRUD | ---- | CRUD | ---- |
| comisiones | CRUD | R--- (solo propias) | ---- | ---- |
| **Herramientas** |
| usuarios | CRUD | ---- | ---- | ---- |
| accesos | CRUD | ---- | ---- | ---- |
| contenido_corporativo | CRUD | ---- | ---- | ---- |
| sucursales | CRUD | ---- | ---- | ---- |
| centro_reglas | CRUD | ---- | ---- | ---- |

**Leyenda**: C = Create, R = Read, U = Update, D = Delete

---

## Funciones de Seguridad

### `current_user_has_role(role_name TEXT)`

Verifica si el usuario actual tiene un rol específico.

```sql
-- Uso en políticas
USING (current_user_has_role('admin'))
```

**Implementación**:
```sql
CREATE FUNCTION public.current_user_has_role(p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_role(auth.uid(), p_role_name);
$$;
```

---

### `user_can_access_project(user_id UUID, project_id UUID)`

Verifica si un usuario puede acceder a un proyecto específico.

**Lógica**:
- **Admin**: Acceso total a todos los proyectos
- **Colaborador**: Solo proyectos donde está asignado en `project_collaborators`
- **Cliente**: Solo su propio proyecto (match por `client_id` del proyecto)

```sql
-- Uso en políticas
USING (user_can_access_project(auth.uid(), project_id))
```

---

### `user_has_module_permission(user_id UUID, module_name TEXT, action TEXT)`

Verifica permisos granulares por módulo.

**Acciones válidas**: `'view'`, `'create'`, `'edit'`, `'delete'`

```sql
-- Uso en políticas
USING (user_has_module_permission(auth.uid(), 'presupuestos', 'view'))
```

**Implementación**: Consulta la tabla `user_permissions` con columnas booleanas:
- `can_view`
- `can_create`
- `can_edit`
- `can_delete`

---

## Políticas RLS por Tabla

### Fase 1: Tablas Críticas

#### `budgets`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_budgets` | admin | CRUD total |
| `collaborator_assigned_budgets` | colaborador | R--- en proyectos asignados |
| `collaborator_edit_budgets` | colaborador | -U-- en proyectos asignados |
| `collaborator_create_budgets` | colaborador | C--- en proyectos asignados |
| `client_published_budgets` | cliente | R--- solo publicados ejecutivos |

#### `budget_items`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_budget_items` | admin | CRUD total |
| `collaborator_budget_items` | colaborador | CRUD en presupuestos de proyectos asignados |
| `client_budget_items_view` | cliente | R--- solo items de presupuestos visibles |

**⚠️ IMPORTANTE**: Los clientes ven items a través de la vista `v_budget_items_client` que **NO expone**:
- `costo_unit`
- `desperdicio_pct`
- `honorarios_pct`
- `proveedor_alias`
- `provider_id`

#### `invoices`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `finance_users_invoices` | admin, contador | CRUD total |

#### `bank_accounts`, `bank_transactions`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `finance_users_*` | admin, contador | CRUD total |

#### `commissions`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_commissions` | admin | CRUD total |
| `user_own_commissions` | colaborador | R--- solo las propias (sujeto_id = auth.uid()) |

---

### Fase 2: Tablas Operativas

#### `construction_stages`, `design_phases`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_*` | admin | CRUD total |
| `project_access_*` | colaborador | CRUD en proyectos asignados |
| `client_view_*` | cliente | R--- en proyectos asignados |

#### `materials_consumption`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_materials_consumption` | admin | CRUD total |
| `project_access_materials_consumption` | colaborador | CRUD vía `stage_id → construction_stages → project_id` |

#### `purchase_orders`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_purchase_orders` | admin | CRUD total |
| `project_access_purchase_orders` | colaborador | CRUD en proyectos asignados con permiso `ordenes_compra` |

---

### Fase 3: Catálogos y Configuración

#### Catálogos (`providers`, `tu_nodes`, `sucursales`, `alianzas`)
| Policy | Rol | Acceso |
|--------|-----|--------|
| `authenticated_read_*` | todos | R--- (lectura pública) |
| `admin_write_*` | admin | CRUD total |

**Excepción `providers`**:
- Lectura: Usuarios con permisos de `proveedores`, `ordenes_compra` o `finanzas`
- Escritura: Admin o usuarios con permiso `proveedores.edit`

#### Configuraciones (`*_config`, `commission_rules`, `business_rules`)
| Policy | Rol | Acceso |
|--------|-----|--------|
| `read_*_config` | todos | R--- (lectura pública) |
| `admin_*_config` | admin | CRUD total |

---

### Fase 4: Tablas Auxiliares

#### `user_roles`, `user_permissions`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_manage_*` | admin | CRUD total |
| `users_view_own_*` | todos | R--- solo propios (user_id = auth.uid()) |

#### `leads`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_leads` | admin | CRUD total |
| `collaborator_manage_leads` | colaborador | CRUD con permiso `leads` |

#### `gantt_plans`, `gantt_items`, `gantt_ministrations`
| Policy | Rol | Acceso |
|--------|-----|--------|
| `admin_all_*` | admin | CRUD total |
| `project_access_*` | colaborador | CRUD en proyectos asignados con permiso `cronograma` |

---

## Guía de Testing

### Test 1: Admin puede ver todos los presupuestos
```sql
-- Login como admin
SELECT COUNT(*) FROM public.budgets; 
-- Esperado: Todos los presupuestos
```

### Test 2: Colaborador solo ve presupuestos asignados
```sql
-- Login como colaborador (asignado a proyecto X)
SELECT COUNT(*) FROM public.budgets; 
-- Esperado: Solo presupuestos del proyecto X
```

### Test 3: Cliente solo ve presupuestos publicados ejecutivos
```sql
-- Login como cliente
SELECT COUNT(*) FROM public.budgets; 
-- Esperado: Solo presupuestos publicados ejecutivos de su proyecto
```

### Test 4: Clientes NO ven columnas sensibles
```sql
-- Login como cliente
SELECT costo_unit FROM public.budget_items LIMIT 1;
-- Esperado: NULL o error (columna no visible en v_budget_items_client)
```

### Test 5: Contador puede ver invoices
```sql
-- Login como contador
SELECT COUNT(*) FROM public.invoices;
-- Esperado: Todas las invoices
```

### Test 6: Colaborador NO puede ver invoices
```sql
-- Login como colaborador
SELECT COUNT(*) FROM public.invoices;
-- Esperado: 0 o error (no tiene permiso de finanzas)
```

### Test 7: Usuario ve solo sus propias comisiones
```sql
-- Login como colaborador
SELECT COUNT(*) FROM public.commissions WHERE sujeto_id = auth.uid();
-- Esperado: Solo las comisiones propias
```

---

## Troubleshooting

### Error: "permission denied for table X"

**Causas comunes**:
1. Usuario no tiene rol asignado en `user_roles`
2. No existen permisos sembrados en `user_permissions`
3. La política RLS está rechazando el acceso

**Diagnóstico**:
```sql
-- 1. Verificar roles del usuario
SELECT role_name FROM user_roles WHERE user_id = auth.uid();

-- 2. Verificar permisos sembrados
SELECT * FROM user_permissions WHERE user_id = auth.uid();

-- 3. Verificar si RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'X';

-- 4. Ver políticas activas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'X';
```

**Solución**:
```sql
-- Sembrar permisos para usuario existente
SELECT public.seed_role_permissions('[user_id]', 'colaborador');
```

---

### Error: "No rows returned" (SELECT vacío)

**Causas comunes**:
1. RLS está habilitado pero no hay políticas que permitan SELECT
2. La política SELECT está muy restrictiva
3. El usuario no cumple con las condiciones de la política

**Diagnóstico**:
```sql
-- Ver políticas SELECT de la tabla
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'X' AND cmd = 'SELECT';
```

**Solución temporal (solo desarrollo)**:
```sql
-- Deshabilitar RLS temporalmente
ALTER TABLE public.X DISABLE ROW LEVEL SECURITY;
```

---

### Error: "Infinite recursion detected in policy"

**Causa**: La política está consultando la misma tabla que protege.

**Ejemplo problemático**:
```sql
-- ❌ MAL - recursión infinita
CREATE POLICY "admin_policy" ON public.profiles
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

**Solución**: Usar función `SECURITY DEFINER`:
```sql
-- ✅ BIEN - sin recursión
CREATE FUNCTION public.current_user_has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_name = $1
  );
$$;

CREATE POLICY "admin_policy" ON public.profiles
FOR SELECT USING (public.current_user_has_role('admin'));
```

---

### Query muy lento después de habilitar RLS

**Causas**:
1. Falta de índices en columnas usadas en políticas
2. Políticas con JOINs complejos

**Solución**:
```sql
-- Crear índices en columnas de políticas frecuentes
CREATE INDEX idx_budgets_project_id ON budgets(project_id);
CREATE INDEX idx_project_collaborators_user_project 
  ON project_collaborators(user_id, project_id);
CREATE INDEX idx_user_permissions_user_module 
  ON user_permissions(user_id, module_name);
```

---

## Rollback de Emergencia

Si necesitas deshabilitar RLS temporalmente:

### Rollback Global (solo admin)
```sql
-- Ejecutar función de rollback
SELECT public.emergency_disable_all_rls();
```

### Rollback por Fase
```bash
# Ejecutar script de rollback
psql -f docs/emergency-rollback.sql
```

**⚠️ IMPORTANTE**: Después del rollback:
1. Notificar al equipo
2. Documentar el motivo
3. Planear re-habilitación

---

## Monitoreo

### Dashboard de Logs de Postgres
```sql
-- Ver errores de permisos recientes
SELECT * FROM postgres_logs 
WHERE event_message ILIKE '%permission denied%'
ORDER BY timestamp DESC 
LIMIT 20;
```

### Auditoría de Cambios de Roles
```sql
-- Ver historial de cambios de roles
SELECT 
  u.email,
  a.action,
  a.old_roles,
  a.new_roles,
  a.changed_at
FROM user_role_audit a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.changed_at DESC
LIMIT 50;
```

---

## Referencias

- [Plan de Implementación RLS](./RLS_IMPLEMENTATION_PLAN.md)
- [Procedimientos de Emergencia](./RLS_EMERGENCY_PROCEDURES.md)
- [Checklist Fase 0](./RLS_PHASE0_CHECKLIST.md)
- [Script de Rollback](./emergency-rollback.sql)

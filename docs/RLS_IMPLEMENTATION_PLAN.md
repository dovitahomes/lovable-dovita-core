# Plan de Implementación RLS - Sistema Dovita Core

## Resumen Ejecutivo

Este documento detalla el plan completo para implementar Row-Level Security (RLS) en el sistema Dovita Core, asegurando la protección de datos sensibles y el control granular de acceso por rol y módulo.

## Estado Actual del Proyecto

### ✅ Fase 0: Pre-Requisitos + Reforzada (COMPLETADA)

**Día 1: Pre-Requisitos**
- ✅ Migración de base de datos con funciones RPC y helpers
- ✅ Tabla `user_metadata` creada
- ✅ Funciones `admin_set_user_roles()`, `user_can_access_project()`, `user_has_module_permission()` creadas
- ✅ Permisos sembrados para usuarios existentes
- ✅ `/herramientas/identidades` corregido (usa `profiles` + `user_metadata`)
- ✅ `UserRoleBadges` re-habilitado con RPC
- ✅ Documentación de rollback creada (`/docs/emergency-rollback.sql`, `/docs/RLS_EMERGENCY_PROCEDURES.md`)

**Día 2: Sistema de Auditoría**
- ✅ Tabla `user_role_audit` creada
- ✅ Trigger `audit_user_role_change()` implementado
- ✅ Componente `RoleChangeHistory.tsx` creado e integrado en `/herramientas/usuarios`
- ✅ Auditoría registra: acción, roles anteriores/nuevos, quién cambió, IP, timestamp

**Día 3: Rollback de Emergencia**
- ✅ Función `emergency_disable_all_rls()` mejorada (retorna tabla de resultados)
- ✅ Componente `EmergencyRollbackButton.tsx` creado e integrado en `/herramientas/accesos`
- ✅ Botón solo visible para admins (`can('accesos', 'delete')`)
- ✅ AlertDialog con warnings y confirmación

**Día 4: Protección de Columnas Sensibles**
- ✅ Vista `v_budget_items_client` creada (sin costo_unit, desperdicio_pct, honorarios_pct, proveedor_alias, provider_id)
- ✅ Hook `useClientBudgetItems` creado (detecta permisos y usa vista correcta)
- ✅ `BudgetItemRow.tsx` refactorizado (oculta columnas sensibles para clientes)
- ✅ `BudgetItemDialog.tsx` refactorizado (oculta campos sensibles para clientes)
- ✅ Función `is_client_user()` creada

**Día 5: Activación de Guards**
- ✅ `RequireModule` activado en `src/routes/guards.tsx`
- ✅ Guards verifican `canView(moduleName)` antes de permitir acceso
- ✅ Redirige a "/" si usuario no tiene permiso

**Día 6: Integración `useModuleAccess` en Componentes**
- ✅ `BudgetItemRow` y `BudgetItemDialog` integrados
- ✅ Botones de editar/eliminar condicionados por `can('modulo', 'edit|delete')`

---

## 📊 Próximas Fases

### Fase 1: RLS en Tablas Críticas (Días 7-10)

**Objetivo**: Proteger datos financieros y presupuestales críticos.

**Tablas a proteger**:
- `budgets`, `budget_items`, `budget_audit`
- `invoices`, `invoice_payments`
- `bank_accounts`, `bank_transactions`
- `commissions`
- `payment_batches`, `payment_batch_items`
- `payments`

**Políticas RLS a implementar**:
1. **Admins**: Acceso completo a todo
2. **Colaboradores**: Acceso a proyectos asignados vía `project_collaborators` o `created_by`
3. **Clientes**: Solo acceso a sus propios proyectos vía `projects.client_id = get_client_id_from_auth()`
4. **Contadores**: Acceso de solo lectura a tablas financieras

**Script de rollback**: Deshabilitar RLS en estas 13 tablas

---

### Fase 2: RLS en Tablas Operativas (Días 11-14)

**Objetivo**: Proteger datos de construcción, diseño y operaciones.

**Tablas a proteger**:
- `construction_stages`, `materials_consumption`, `project_crew`, `project_equipment`, `project_subcontractors`
- `purchase_orders`
- `design_phases`, `design_deliverables`, `design_change_logs`
- `project_messages`, `project_events`, `calendar_events`

**Políticas RLS**:
- Basadas en `user_can_access_project(auth.uid(), project_id)`
- Clientes: ver solo datos con `visibilidad = 'cliente'` (donde aplique)

**Script de rollback**: Deshabilitar RLS en estas 13 tablas

---

### Fase 3: RLS en Catálogos y Configuraciones (Días 15-17)

**Objetivo**: Proteger catálogos compartidos y configuraciones del sistema.

**Tablas a proteger**:
- `providers`, `tu_nodes`, `sucursales`, `alianzas`
- `pricing_config`, `consumption_config`, `commission_config`, `finance_config`
- `commission_rules`, `business_rules`, `budget_templates`

**Políticas RLS**:
- **Lectura amplia**: Todos los autenticados pueden leer
- **Escritura restringida**: Solo admin/colaboradores pueden modificar

**Script de rollback**: Deshabilitar RLS en estas 12 tablas

---

### Fase 4: Auditoría, Optimización y Frontend (Días 18-21)

**Objetivo**: Resolver todos los issues del linter, optimizar y finalizar integración frontend.

**Tareas**:
1. **Políticas faltantes**:
   - `user_roles`: Políticas para que usuarios vean sus propios roles
   - `user_permissions`: Políticas para que usuarios vean sus propios permisos
   - `user_metadata`: Políticas para que usuarios vean/editen su metadata
   - `user_role_audit`: Políticas para que admins vean auditoría

2. **Optimización de Performance**:
   - Crear índices adicionales en columnas usadas en políticas RLS
   - Verificar que no haya N+1 queries
   - Probar con dataset grande (1000+ proyectos)

3. **Refactorización Frontend**:
   - Aplicar `useModuleAccess` en ~20 componentes restantes
   - Patrón: `{can('modulo', 'create') && <Button>Crear</Button>}`
   - Módulos prioritarios: Leads, Clientes, Proyectos, Proveedores, Finanzas, Construcción

4. **Documentación Final**:
   - Crear `/docs/RLS_POLICIES.md` con matriz completa de permisos
   - Crear `/docs/RLS_TESTING_GUIDE.md` con casos de prueba
   - Actualizar `/docs/RLS_PHASE0_CHECKLIST.md` con resultados

5. **Testing E2E**:
   - Crear usuario de cada rol (admin, colaborador, contador, cliente)
   - Probar acceso a cada módulo
   - Verificar que datos sensibles NO sean visibles para clientes

**Script de rollback**: Deshabilitar TODAS las políticas RLS

---

## 🎯 Métricas de Éxito

| Métrica | Objetivo | Estado Actual |
|---------|----------|---------------|
| Linter issues resueltos | 0 de 75 | 5 de 75 (Fase 0) |
| Tablas con RLS habilitado | 40+ | 3 (user_role_audit, user_metadata, profiles) |
| Componentes con `useModuleAccess` | 20+ | 2 (BudgetItemRow, BudgetItemDialog) |
| Módulos admin funcionales | 3 | 3 (✅ Usuarios, Identidades, Accesos) |
| Documentación completa | 100% | 60% (emergency docs, checklist) |
| Testing en staging | 100% | 0% (pendiente Fase 1) |

---

## 🚨 Riesgos Identificados y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Bloqueo de usuarios legítimos | Media | Alto | Script de rollback de emergencia + testing exhaustivo en staging |
| Performance degradado | Baja | Medio | Índices en columnas de políticas + análisis de queries |
| Recursión infinita en políticas | Baja | Alto | Usar funciones `SECURITY DEFINER` para helpers |
| Datos sensibles expuestos | Baja | Crítico | Vistas filtradas (`v_budget_items_client`) + tests con cliente real |

---

## 📅 Timeline Estimado

- **Fase 0**: ✅ Completada (7 días reales)
- **Fase 1**: 4 días (siguiente sprint)
- **Fase 2**: 4 días
- **Fase 3**: 3 días
- **Fase 4**: 4 días
- **Total**: 22 días (~1 mes de calendario con margen)

---

## 📞 Contactos y Responsables

- **Lead Developer**: [Nombre]
- **DBA**: [Nombre]
- **QA Lead**: [Nombre]
- **Product Owner**: [Nombre]

---

**Última actualización**: 2025-01-07  
**Próxima revisión**: Al finalizar Fase 1  
**Mantenido por**: Equipo de Desarrollo Dovita Core

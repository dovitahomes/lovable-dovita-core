# Procedimientos de Emergencia - Sistema RLS

## ⚠️ Cuándo Usar Este Documento

Este documento debe usarse **ÚNICAMENTE** en las siguientes situaciones de emergencia:

1. Los usuarios legítimos no pueden acceder a datos críticos
2. El sistema está completamente bloqueado para operaciones normales
3. Hay evidencia de que las políticas RLS están causando pérdida de servicio
4. Se requiere acceso inmediato para resolver un problema de producción

## 🚨 Procedimiento de Rollback de Emergencia

### Opción 1: Rollback Global (Crítico)

**⚠️ ADVERTENCIA:** Esto deshabilitará RLS en TODAS las tablas del sistema.

#### Pasos:

1. **Conectarse a la base de datos** como administrador:
   ```bash
   # En Supabase Dashboard > SQL Editor
   # O usando psql localmente
   ```

2. **Ejecutar función de rollback global**:
   ```sql
   SELECT emergency_disable_all_rls();
   ```

3. **Verificar que RLS está deshabilitado**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND rowsecurity = true;
   ```
   
   Debe retornar **0 filas**.

4. **Notificar al equipo**:
   - Enviar mensaje en canal de emergencia
   - Documentar el incidente
   - Crear ticket de seguimiento

5. **Planificar re-habilitación**:
   - Identificar la causa raíz
   - Corregir políticas problemáticas
   - Probar en staging antes de re-habilitar

---

### Opción 2: Rollback por Fase (Selectivo)

Si conoces qué fase está causando problemas:

#### Rollback Fase 0 (Pre-Requisitos)
```sql
-- Ver script en docs/emergency-rollback.sql
-- Sección: ROLLBACK FASE 0
```

#### Rollback Fase 1 (Tablas Críticas)
```sql
-- Deshabilitar RLS en tablas financieras
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
-- ... (ver lista completa en emergency-rollback.sql)
```

#### Rollback Fase 2 (Tablas Operativas)
```sql
ALTER TABLE construction_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
-- ... (ver lista completa en emergency-rollback.sql)
```

#### Rollback Fase 3 (Catálogos)
```sql
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tu_nodes DISABLE ROW LEVEL SECURITY;
-- ... (ver lista completa en emergency-rollback.sql)
```

---

## 🔍 Diagnóstico Pre-Rollback

**ANTES** de ejecutar un rollback, intenta diagnosticar el problema:

### 1. Verificar Permisos de Usuario
```sql
-- Verificar roles del usuario
SELECT role_name 
FROM user_roles 
WHERE user_id = 'USER_ID_AQUI';

-- Verificar permisos de módulo
SELECT module_name, can_view, can_create, can_edit, can_delete
FROM user_permissions
WHERE user_id = 'USER_ID_AQUI';
```

### 2. Verificar Políticas Activas
```sql
-- Ver políticas en una tabla específica
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'NOMBRE_TABLA';
```

### 3. Probar Acceso Directo
```sql
-- Probar SELECT directo (como superadmin)
SET ROLE postgres;
SELECT * FROM budgets LIMIT 5;
RESET ROLE;
```

### 4. Revisar Logs de Supabase
```
Supabase Dashboard > Logs > PostgreSQL Logs
Filtrar por: "permission denied" o "RLS"
```

---

## 📋 Checklist Post-Rollback

Después de ejecutar un rollback de emergencia:

- [ ] Verificar que usuarios pueden acceder nuevamente
- [ ] Documentar el problema en issue tracker
- [ ] Identificar políticas o funciones problemáticas
- [ ] Crear ambiente de staging con datos de prueba
- [ ] Reproducir el problema en staging
- [ ] Corregir las políticas/funciones
- [ ] Probar exhaustivamente en staging
- [ ] Planificar ventana de mantenimiento para re-habilitar
- [ ] Notificar a stakeholders sobre timeline de resolución

---

## 🔧 Diagnóstico de Problemas Comunes

### Problema: "permission denied for table X"

**Causa:** Política RLS demasiado restrictiva o función helper retorna `false`.

**Solución:**
```sql
-- Verificar función helper
SELECT user_has_module_permission(
  'USER_ID'::uuid, 
  'presupuestos', 
  'view'
);

-- Si retorna false, verificar user_permissions
SELECT * FROM user_permissions 
WHERE user_id = 'USER_ID' AND module_name = 'presupuestos';
```

---

### Problema: "infinite recursion detected in RLS policy"

**Causa:** Política RLS llama a una función que consulta la misma tabla.

**Solución:**
```sql
-- Identificar la política recursiva
SELECT policyname FROM pg_policies WHERE tablename = 'TABLA_PROBLEMA';

-- Deshabilitar temporalmente esa política
ALTER POLICY "nombre_politica" ON tabla_problema DISABLE;
```

---

### Problema: Clientes ven datos que no deberían

**Causa:** Política demasiado permisiva o condición `WITH CHECK` incorrecta.

**Solución:**
```sql
-- Verificar política de cliente
SELECT * FROM pg_policies 
WHERE tablename = 'budgets' 
  AND policyname LIKE '%client%';

-- Revisar la expresión USING y WITH CHECK
-- Debe incluir verificación de client_id o proyecto
```

---

## 📞 Contactos de Emergencia

- **DBA Lead:** [Nombre] - [Email/Phone]
- **DevOps Lead:** [Nombre] - [Email/Phone]
- **CTO:** [Nombre] - [Email/Phone]

---

## 📖 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Script completo de rollback: `docs/emergency-rollback.sql`
- Plan de implementación: `docs/RLS_IMPLEMENTATION_PLAN.md`

---

**Última actualización:** 2025-01-07  
**Mantenido por:** Equipo de Ingeniería Dovita Core

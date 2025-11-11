# Guía de Testing RLS - Dovita Core

## Objetivo

Esta guía proporciona un framework completo para testing exhaustivo de Row-Level Security (RLS), verificando que cada rol tenga exactamente los permisos correctos sin exponer datos sensibles.

## Testing por Roles

### 1. Testing de Rol Admin

**Expectativa**: Acceso completo a todos los datos de todos los proyectos.

#### Setup

```sql
-- Crear usuario admin de prueba
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@dovita.com');

INSERT INTO user_roles (user_id, role_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin');

-- Simular autenticación como admin
SET LOCAL "request.jwt.claims" = '{
  "sub": "00000000-0000-0000-0000-000000000001",
  "email": "admin@dovita.com",
  "role": "authenticated"
}';
```

#### Tests Admin

```sql
-- ✅ Admin debe ver TODOS los proyectos
SELECT COUNT(*) FROM projects;
-- Esperado: COUNT = total de proyectos en BD

-- ✅ Admin debe poder crear proyectos
INSERT INTO projects (client_id, status) 
VALUES ('client-uuid', 'diseño');
-- Esperado: Éxito

-- ✅ Admin debe poder actualizar cualquier proyecto
UPDATE projects SET status = 'construccion' WHERE id = 'any-project-uuid';
-- Esperado: Éxito

-- ✅ Admin debe poder eliminar proyectos
DELETE FROM projects WHERE id = 'test-project-uuid';
-- Esperado: Éxito

-- ✅ Admin debe ver datos financieros sensibles
SELECT * FROM budgets WHERE project_id = 'any-project-uuid';
SELECT * FROM budget_items WHERE budget_id = 'any-budget-uuid';
-- Esperado: Retorna TODAS las columnas incluyendo costo_real, percent_honorarios

-- ✅ Admin debe poder gestionar roles
INSERT INTO user_roles (user_id, role_name) VALUES ('user-uuid', 'colaborador');
-- Esperado: Éxito

-- ✅ Admin debe ver todos los leads (CRM)
SELECT COUNT(*) FROM leads;
-- Esperado: COUNT = total de leads en BD
```

### 2. Testing de Rol Colaborador

**Expectativa**: Acceso solo a proyectos asignados, sin datos financieros sensibles de otros proyectos.

#### Setup

```sql
-- Crear usuario colaborador de prueba
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000002', 'colaborador@dovita.com');

INSERT INTO user_roles (user_id, role_name)
VALUES ('00000000-0000-0000-0000-000000000002', 'colaborador');

-- Asignar a proyecto específico
INSERT INTO project_collaborators (project_id, user_id)
VALUES ('project-uuid-1', '00000000-0000-0000-0000-000000000002');

-- Simular autenticación como colaborador
SET LOCAL "request.jwt.claims" = '{
  "sub": "00000000-0000-0000-0000-000000000002",
  "email": "colaborador@dovita.com",
  "role": "authenticated"
}';
```

#### Tests Colaborador

```sql
-- ✅ Colaborador debe ver SOLO proyectos asignados
SELECT * FROM projects;
-- Esperado: Solo retorna project-uuid-1

-- ❌ Colaborador NO debe ver proyectos no asignados
SELECT * FROM projects WHERE id = 'project-uuid-2';
-- Esperado: 0 filas

-- ✅ Colaborador debe poder actualizar proyectos asignados
UPDATE projects SET status = 'construccion' WHERE id = 'project-uuid-1';
-- Esperado: Éxito

-- ❌ Colaborador NO debe poder actualizar proyectos no asignados
UPDATE projects SET status = 'construccion' WHERE id = 'project-uuid-2';
-- Esperado: Error o 0 filas afectadas

-- ✅ Colaborador debe ver presupuestos de proyectos asignados
SELECT * FROM budgets WHERE project_id = 'project-uuid-1';
-- Esperado: Retorna datos

-- ❌ Colaborador NO debe ver presupuestos de otros proyectos
SELECT * FROM budgets WHERE project_id = 'project-uuid-2';
-- Esperado: 0 filas

-- ✅ Colaborador debe poder crear eventos en proyectos asignados
INSERT INTO project_events (project_id, title, start_time, end_time, visibility)
VALUES ('project-uuid-1', 'Reunión', '2025-01-15 10:00', '2025-01-15 11:00', 'client');
-- Esperado: Éxito

-- ❌ Colaborador NO debe poder crear eventos en proyectos no asignados
INSERT INTO project_events (project_id, title, start_time, end_time, visibility)
VALUES ('project-uuid-2', 'Reunión', '2025-01-15 10:00', '2025-01-15 11:00', 'client');
-- Esperado: Error - violación de RLS

-- ✅ Colaborador debe ver mensajes de chat en proyectos asignados
SELECT * FROM project_messages WHERE project_id = 'project-uuid-1';
-- Esperado: Retorna mensajes

-- ❌ Colaborador NO debe ver mensajes de otros proyectos
SELECT * FROM project_messages WHERE project_id = 'project-uuid-2';
-- Esperado: 0 filas

-- ✅ Colaborador debe poder enviar mensajes en chat de proyectos asignados
INSERT INTO project_messages (project_id, sender_id, message_text)
VALUES ('project-uuid-1', '00000000-0000-0000-0000-000000000002', 'Hola cliente');
-- Esperado: Éxito

-- ✅ Colaborador debe poder gestionar leads/CRM
SELECT * FROM leads;
INSERT INTO leads (nombre_completo, email) VALUES ('Juan Pérez', 'juan@example.com');
UPDATE leads SET status = 'contactado' WHERE id = 'lead-uuid';
-- Esperado: Éxito en todas las operaciones CRM
```

### 3. Testing de Rol Cliente

**Expectativa**: Acceso SOLO a sus propios proyectos, sin datos internos/sensibles.

#### Setup

```sql
-- Crear usuario cliente de prueba
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000003', 'cliente@example.com');

INSERT INTO user_roles (user_id, role_name)
VALUES ('00000000-0000-0000-0000-000000000003', 'cliente');

-- Crear registro en tabla clients
INSERT INTO clients (id, email, name)
VALUES ('client-uuid-1', 'cliente@example.com', 'Juan Pérez');

-- Crear proyecto del cliente
INSERT INTO projects (id, client_id, status)
VALUES ('project-client-1', 'client-uuid-1', 'construccion');

-- Simular autenticación como cliente
SET LOCAL "request.jwt.claims" = '{
  "sub": "00000000-0000-0000-0000-000000000003",
  "email": "cliente@example.com",
  "role": "authenticated"
}';
```

#### Tests Cliente

```sql
-- ✅ Cliente debe ver SOLO sus propios proyectos (via vista)
SELECT * FROM v_client_projects;
-- Esperado: Solo retorna project-client-1

-- ❌ Cliente NO debe ver proyectos de otros clientes
SELECT * FROM v_client_projects WHERE client_id != 'client-uuid-1';
-- Esperado: 0 filas

-- ❌ Cliente NO debe acceder directamente a tabla projects
SELECT * FROM projects;
-- Esperado: 0 filas (RLS bloquea acceso directo)

-- ✅ Cliente debe ver eventos visibles para él (via vista)
SELECT * FROM v_client_events WHERE project_id = 'project-client-1';
-- Esperado: Solo eventos con visibility='client'

-- ❌ Cliente NO debe ver eventos internos (visibility='team')
SELECT * FROM v_client_events WHERE visibility = 'team';
-- Esperado: 0 filas (vista filtra automáticamente)

-- ✅ Cliente debe poder solicitar citas
INSERT INTO project_events (
  project_id, title, start_time, end_time, 
  status, visibility, created_by
) VALUES (
  'project-client-1', 'Solicitud de cita', 
  '2025-01-20 10:00', '2025-01-20 11:00',
  'propuesta', 'client', 
  '00000000-0000-0000-0000-000000000003'
);
-- Esperado: Éxito

-- ✅ Cliente debe poder aceptar/rechazar propuestas de colaboradores
UPDATE project_events 
SET status = 'aceptada'
WHERE project_id = 'project-client-1'
AND id = 'event-uuid'
AND created_by != '00000000-0000-0000-0000-000000000003'; -- No creado por él
-- Esperado: Éxito

-- ❌ Cliente NO debe poder cancelar citas ya aceptadas
UPDATE project_events 
SET status = 'cancelada'
WHERE project_id = 'project-client-1'
AND status = 'aceptada';
-- Esperado: Error o 0 filas afectadas (policy bloquea)

-- ✅ Cliente debe poder cancelar sus propias solicitudes pendientes
UPDATE project_events 
SET status = 'cancelada'
WHERE project_id = 'project-client-1'
AND created_by = '00000000-0000-0000-0000-000000000003'
AND status = 'propuesta';
-- Esperado: Éxito

-- ✅ Cliente debe ver resumen financiero SIN datos sensibles (via vista)
SELECT * FROM v_client_financial_summary WHERE project_id = 'project-client-1';
-- Esperado: Retorna total_deposits, total_expenses, balance
-- NO debe incluir: costo_real, percent_honorarios, proveedor_tag

-- ✅ Cliente debe ver partidas presupuestarias SIN costos internos (via vista)
SELECT * FROM v_client_budget_items WHERE project_id = 'project-client-1';
-- Esperado: Retorna descripcion, unidad, cantidad, precio_unitario, total
-- NO debe incluir: costo_real, percent_desperdicio, percent_honorarios

-- ❌ Cliente NO debe acceder directamente a budget_items
SELECT * FROM budget_items WHERE budget_id = 'budget-uuid';
-- Esperado: 0 filas (RLS bloquea acceso directo)

-- ✅ Cliente debe poder enviar mensajes en chat de su proyecto
INSERT INTO project_messages (project_id, sender_id, message_text)
VALUES ('project-client-1', '00000000-0000-0000-0000-000000000003', 'Hola equipo');
-- Esperado: Éxito

-- ❌ Cliente NO debe poder enviar mensajes en chats de otros proyectos
INSERT INTO project_messages (project_id, sender_id, message_text)
VALUES ('project-client-2', '00000000-0000-0000-0000-000000000003', 'Mensaje');
-- Esperado: Error - violación de RLS

-- ❌ Cliente NO debe acceder a módulos de gestión interna
SELECT * FROM leads;
SELECT * FROM user_roles;
SELECT * FROM user_permissions;
-- Esperado: 0 filas en todas (sin permisos de módulo)
```

### 4. Testing de Rol Contador

**Expectativa**: Acceso a finanzas/contabilidad, sin acceso a CRM o gestión de usuarios.

#### Setup

```sql
-- Crear usuario contador de prueba
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000004', 'contador@dovita.com');

INSERT INTO user_roles (user_id, role_name)
VALUES ('00000000-0000-0000-0000-000000000004', 'contador');

SET LOCAL "request.jwt.claims" = '{
  "sub": "00000000-0000-0000-0000-000000000004",
  "email": "contador@dovita.com",
  "role": "authenticated"
}';
```

#### Tests Contador

```sql
-- ✅ Contador debe ver todas las transacciones financieras
SELECT * FROM transactions;
-- Esperado: Retorna todas las transacciones

-- ✅ Contador debe poder crear transacciones
INSERT INTO transactions (project_id, amount, transaction_type)
VALUES ('project-uuid', 5000.00, 'egreso');
-- Esperado: Éxito

-- ✅ Contador debe ver facturas (CFDI)
SELECT * FROM invoices;
-- Esperado: Retorna todas las facturas

-- ✅ Contador debe poder subir CFDI
INSERT INTO invoices (uuid, emisor_id, receptor_id, total_amount)
VALUES ('cfdi-uuid', 'provider-uuid', 'client-uuid', 10000.00);
-- Esperado: Éxito

-- ❌ Contador NO debe acceder a leads/CRM
SELECT * FROM leads;
-- Esperado: 0 filas (sin permiso de módulo 'leads')

-- ❌ Contador NO debe gestionar usuarios
SELECT * FROM user_roles;
INSERT INTO user_roles (user_id, role_name) VALUES ('uuid', 'admin');
-- Esperado: 0 filas / Error

-- ✅ Contador debe ver proveedores
SELECT * FROM providers;
-- Esperado: Retorna todos los proveedores

-- ✅ Contador debe ver pagos a proveedores
SELECT * FROM payments WHERE provider_id = 'provider-uuid';
-- Esperado: Retorna pagos
```

## Testing de Casos Edge

### 1. Usuario Sin Roles

```sql
-- Usuario autenticado pero sin rol asignado
SET LOCAL "request.jwt.claims" = '{
  "sub": "00000000-0000-0000-0000-000000000099",
  "email": "sinrol@example.com",
  "role": "authenticated"
}';

-- ❌ NO debe tener acceso a ningún recurso
SELECT * FROM projects;
SELECT * FROM leads;
SELECT * FROM transactions;
-- Esperado: 0 filas en todas (sin permisos de módulo)
```

### 2. Colaborador Removido de Proyecto

```sql
-- Colaborador que fue removido de project_collaborators
DELETE FROM project_collaborators 
WHERE user_id = 'colaborador-uuid' AND project_id = 'project-uuid';

SET LOCAL "request.jwt.claims" = '{
  "sub": "colaborador-uuid",
  "email": "colaborador@dovita.com"
}';

-- ❌ NO debe poder acceder al proyecto removido
SELECT * FROM projects WHERE id = 'project-uuid';
-- Esperado: 0 filas
```

### 3. Participante Inactivo en Chat

```sql
-- Participante con is_active = false en project_chat_participants
UPDATE project_chat_participants
SET is_active = false
WHERE user_id = 'colaborador-uuid' AND project_id = 'project-uuid';

-- ❌ NO debe ver mensajes nuevos del chat
SELECT * FROM project_messages 
WHERE project_id = 'project-uuid' 
AND created_at > NOW() - INTERVAL '1 hour';
-- Esperado: 0 filas (policy verifica is_active = true)
```

### 4. Cliente Intentando SQL Injection

```sql
-- Intentar manipular JWT para acceder a otros proyectos
SET LOCAL "request.jwt.claims" = '{
  "sub": "cliente-uuid",
  "email": "cliente@example.com'' OR ''1''=''1",
  "role": "authenticated"
}';

SELECT * FROM v_client_projects;
-- Esperado: 0 filas (query parametrizado previene inyección)
```

## Testing de Performance

### 1. Queries con JOIN Complejos

```sql
-- Verificar que RLS no cause N+1 queries
EXPLAIN ANALYZE
SELECT 
  p.*,
  c.name as client_name,
  COUNT(pe.id) as event_count
FROM projects p
JOIN clients c ON c.id = p.client_id
LEFT JOIN project_events pe ON pe.project_id = p.id
WHERE p.id IN (SELECT project_id FROM project_collaborators WHERE user_id = auth.uid())
GROUP BY p.id, c.name;

-- Verificar:
-- - Planning time < 5ms
-- - Execution time < 50ms para 100 proyectos
-- - Index scans (no Seq Scan en tablas grandes)
```

### 2. Vistas SECURITY DEFINER

```sql
EXPLAIN ANALYZE
SELECT * FROM v_client_projects WHERE client_id = 'client-uuid';

-- Verificar:
-- - Usa índice en clients.email
-- - Planning time < 2ms
-- - Execution time < 10ms
```

## Automation Script

### Script de Testing Completo

```bash
#!/bin/bash
# scripts/test-rls.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔐 Iniciando Testing RLS..."

# Test 1: Admin tiene acceso completo
echo "Testing: Admin acceso completo..."
RESULT=$(psql $DATABASE_URL -c "
  SET LOCAL \"request.jwt.claims\" = '{\"sub\": \"admin-uuid\", \"email\": \"admin@dovita.com\"}';
  SELECT COUNT(*) FROM projects;
")
if [ $RESULT -gt 0 ]; then
  echo -e "${GREEN}✅ Admin: OK${NC}"
else
  echo -e "${RED}❌ Admin: FAIL${NC}"
fi

# Test 2: Colaborador solo ve proyectos asignados
echo "Testing: Colaborador proyectos asignados..."
RESULT=$(psql $DATABASE_URL -c "
  SET LOCAL \"request.jwt.claims\" = '{\"sub\": \"colaborador-uuid\"}';
  SELECT COUNT(*) FROM projects WHERE id NOT IN (
    SELECT project_id FROM project_collaborators WHERE user_id = 'colaborador-uuid'
  );
")
if [ $RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ Colaborador: OK${NC}"
else
  echo -e "${RED}❌ Colaborador: FAIL (ve proyectos no asignados)${NC}"
fi

# Test 3: Cliente no ve datos sensibles
echo "Testing: Cliente sin datos sensibles..."
COLUMNS=$(psql $DATABASE_URL -t -c "
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'v_client_budget_items' 
  AND column_name IN ('costo_real', 'percent_honorarios', 'proveedor_tag');
")
if [ -z "$COLUMNS" ]; then
  echo -e "${GREEN}✅ Cliente: OK (sin datos sensibles)${NC}"
else
  echo -e "${RED}❌ Cliente: FAIL (expone: $COLUMNS)${NC}"
fi

echo "🏁 Testing RLS completado."
```

## Referencias

- **Políticas RLS**: `docs/RLS_POLICIES.md`
- **Vistas de Cliente**: `docs/CLIENT_VIEWS_SECURITY.md`
- **Rollback de Emergencia**: `docs/RLS_EMERGENCY_PROCEDURES.md`

---

**Última actualización**: 2025-01-11  
**Mantenido por**: Equipo de Seguridad Dovita Core

# Monitoreo y Auditoría de Seguridad - Dovita Core

## Resumen Ejecutivo

Este documento define estrategias de monitoreo continuo para detectar accesos no autorizados, intentos de escalación de privilegios, y anomalías en el uso del sistema.

## 1. Habilitar Leaked Password Protection

### ¿Qué es?

**Leaked Password Protection** previene que usuarios creen cuentas con contraseñas que han sido expuestas en brechas de seguridad conocidas (ej: "123456", "password", etc.).

### Cómo Habilitarlo

1. **Dashboard de Supabase**:
   - Navegar a: `Authentication` → `Providers` → `Email`
   - Activar toggle: **"Enable Leaked Password Protection"**
   - Guardar cambios

2. **Verificar Habilitación**:
```sql
-- No hay query SQL, se verifica en el Dashboard
-- El toggle debe estar en ON (verde)
```

### Impacto

- **Usuarios afectados**: Nuevos registros y cambios de contraseña
- **Error mostrado**: "This password has been leaked in a data breach. Please use a different password."
- **Downtime**: Ninguno (cambio en caliente)

### Testing

```typescript
// Intentar crear usuario con contraseña débil conocida
const { error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: '123456' // Contraseña en lista de leaks
});

// Esperado: error.message incluye "leaked"
```

---

## 2. Monitoreo de Logs de Postgres

### Queries para Revisar Accesos Denegados

#### Permission Denied Errors

```sql
-- Ver errores de permisos en últimas 24 horas
SELECT 
  timestamp,
  event_message,
  parsed.error_severity,
  parsed.user_name,
  parsed.database_name
FROM postgres_logs
CROSS JOIN UNNEST(metadata) AS m
CROSS JOIN UNNEST(m.parsed) AS parsed
WHERE event_message ILIKE '%permission denied%'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;
```

#### RLS Policy Violations

```sql
-- Detectar violaciones de RLS (new row violates policy)
SELECT 
  timestamp,
  event_message,
  parsed.table_name,
  parsed.policy_name
FROM postgres_logs
CROSS JOIN UNNEST(metadata) AS m
CROSS JOIN UNNEST(m.parsed) AS parsed
WHERE event_message ILIKE '%violates row-level security policy%'
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC
LIMIT 100;
```

#### Intentos de Acceso a Tablas Críticas

```sql
-- Detectar accesos fallidos a tablas sensibles
SELECT 
  timestamp,
  event_message,
  parsed.user_name,
  parsed.database_name
FROM postgres_logs
CROSS JOIN UNNEST(metadata) AS m
CROSS JOIN UNNEST(m.parsed) AS parsed
WHERE (
  event_message ILIKE '%user_roles%' OR
  event_message ILIKE '%user_permissions%' OR
  event_message ILIKE '%invoices%' OR
  event_message ILIKE '%transactions%'
)
AND parsed.error_severity IN ('ERROR', 'FATAL')
AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;
```

---

## 3. Monitoreo de Auth Logs

### Intentos de Login Fallidos

```sql
-- Ver intentos de login fallidos en últimas 24 horas
SELECT 
  id,
  auth_logs.timestamp,
  event_message,
  metadata.level,
  metadata.msg,
  metadata.error
FROM auth_logs
CROSS JOIN UNNEST(metadata) AS metadata
WHERE metadata.level = 'error'
  AND event_message ILIKE '%login%'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;
```

### Múltiples Intentos Fallidos del Mismo Email

```sql
-- Detectar posibles ataques de fuerza bruta
WITH failed_attempts AS (
  SELECT 
    metadata.email,
    COUNT(*) as attempt_count,
    MIN(timestamp) as first_attempt,
    MAX(timestamp) as last_attempt
  FROM auth_logs
  CROSS JOIN UNNEST(metadata) AS metadata
  WHERE metadata.level = 'error'
    AND metadata.email IS NOT NULL
    AND timestamp > NOW() - INTERVAL '1 hour'
  GROUP BY metadata.email
)
SELECT 
  email,
  attempt_count,
  first_attempt,
  last_attempt,
  EXTRACT(EPOCH FROM (last_attempt - first_attempt)) / 60 as duration_minutes
FROM failed_attempts
WHERE attempt_count >= 5 -- 5+ intentos fallidos
ORDER BY attempt_count DESC;
```

### Sesiones de Usuarios

```sql
-- Ver sesiones activas de usuarios
SELECT 
  id,
  timestamp,
  event_message,
  metadata.user_id,
  metadata.email
FROM auth_logs
CROSS JOIN UNNEST(metadata) AS metadata
WHERE event_message ILIKE '%session%'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 50;
```

---

## 4. Auditoría de Cambios de Roles

### Tabla de Auditoría

La tabla `user_role_audit` registra automáticamente cambios de roles:

```sql
-- Ver cambios de roles en últimos 7 días
SELECT 
  ura.created_at,
  u.email as user_affected,
  ura.action,
  ura.old_roles,
  ura.new_roles,
  admin.email as changed_by
FROM user_role_audit ura
JOIN auth.users u ON u.id = ura.user_id
LEFT JOIN auth.users admin ON admin.id = ura.changed_by
WHERE ura.created_at > NOW() - INTERVAL '7 days'
ORDER BY ura.created_at DESC;
```

### Detectar Escalación de Privilegios Sospechosa

```sql
-- Detectar usuarios que ganaron rol 'admin' recientemente
SELECT 
  ura.created_at,
  u.email as new_admin,
  admin.email as granted_by,
  ura.ip_address
FROM user_role_audit ura
JOIN auth.users u ON u.id = ura.user_id
LEFT JOIN auth.users admin ON admin.id = ura.changed_by
WHERE 'admin' = ANY(ura.new_roles)
  AND NOT ('admin' = ANY(ura.old_roles))
  AND ura.created_at > NOW() - INTERVAL '30 days'
ORDER BY ura.created_at DESC;
```

---

## 5. Alertas Automáticas

### Configurar Alertas en Supabase Dashboard

1. **Navegar a**: `Settings` → `Integrations` → `Webhooks`

2. **Crear Webhook para Alertas**:
   - URL: `https://your-alerting-service.com/webhook`
   - Eventos: `postgres_changes`, `auth_events`
   - Tabla: `user_role_audit`

### Edge Function para Alertas Críticas

Crear `supabase/functions/security-alerts/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const { type, record, old_record } = await req.json();
  
  // Alerta: Nuevo admin creado
  if (type === 'INSERT' && record.table === 'user_role_audit') {
    const newRoles = record.new_roles || [];
    const oldRoles = record.old_roles || [];
    
    if (newRoles.includes('admin') && !oldRoles.includes('admin')) {
      // Enviar alerta por email/Slack/Discord
      await sendAlert({
        severity: 'HIGH',
        message: `⚠️ Nuevo admin creado: ${record.user_id}`,
        timestamp: record.created_at
      });
    }
  }
  
  // Alerta: Múltiples intentos de login fallidos
  if (type === 'INSERT' && record.table === 'auth_logs') {
    if (record.metadata?.level === 'error' && record.metadata?.email) {
      const email = record.metadata.email;
      
      // Contar intentos en última hora
      const count = await countFailedAttempts(email, '1 hour');
      
      if (count >= 5) {
        await sendAlert({
          severity: 'MEDIUM',
          message: `🔒 Posible ataque de fuerza bruta: ${email} (${count} intentos)`,
          timestamp: record.timestamp
        });
      }
    }
  }
  
  return new Response("OK", { status: 200 });
});

async function sendAlert(alert: {severity: string, message: string, timestamp: string}) {
  // Implementar envío por email, Slack, Discord, etc.
  console.log(`[${alert.severity}] ${alert.message}`);
  
  // Ejemplo: Enviar a Slack
  await fetch(Deno.env.get('SLACK_WEBHOOK_URL')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${alert.message}\nTimestamp: ${alert.timestamp}`
    })
  });
}
```

---

## 6. Métricas de Seguridad (Dashboard)

### KPIs Clave

1. **Intentos de Login Fallidos (últimas 24h)**
   ```sql
   SELECT COUNT(*) 
   FROM auth_logs 
   CROSS JOIN UNNEST(metadata) AS m
   WHERE m.level = 'error' 
     AND event_message ILIKE '%login%'
     AND timestamp > NOW() - INTERVAL '24 hours';
   ```

2. **Violaciones de RLS (última semana)**
   ```sql
   SELECT COUNT(*) 
   FROM postgres_logs
   WHERE event_message ILIKE '%violates row-level security%'
     AND timestamp > NOW() - INTERVAL '7 days';
   ```

3. **Cambios de Roles (último mes)**
   ```sql
   SELECT COUNT(*) 
   FROM user_role_audit
   WHERE created_at > NOW() - INTERVAL '30 days';
   ```

4. **Sesiones Activas Concurrentes**
   ```sql
   SELECT COUNT(DISTINCT metadata.user_id)
   FROM auth_logs
   CROSS JOIN UNNEST(metadata) AS metadata
   WHERE event_message ILIKE '%session%'
     AND timestamp > NOW() - INTERVAL '15 minutes';
   ```

### Dashboard Grafana / Metabase

Crear dashboard con:
- **Panel 1**: Gráfico de líneas de intentos de login fallidos (últimos 7 días)
- **Panel 2**: Tabla de usuarios con más intentos fallidos (top 10)
- **Panel 3**: Timeline de cambios de roles (últimos 30 días)
- **Panel 4**: Mapa de calor de violaciones de RLS por tabla

---

## 7. Procedimiento de Respuesta a Incidentes

### Fase 1: Detección

- Monitor detecta anomalía (ej: 10+ intentos de login fallidos)
- Alerta automática enviada a canal Slack #security
- Equipo de seguridad notificado

### Fase 2: Investigación

```sql
-- 1. Identificar usuario/IP afectado
SELECT 
  metadata.email,
  metadata.ip_address,
  COUNT(*) as attempt_count
FROM auth_logs
CROSS JOIN UNNEST(metadata) AS metadata
WHERE metadata.level = 'error'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY metadata.email, metadata.ip_address
ORDER BY attempt_count DESC;

-- 2. Revisar actividad reciente del usuario
SELECT 
  timestamp,
  event_message,
  metadata.action
FROM auth_logs
CROSS JOIN UNNEST(metadata) AS metadata
WHERE metadata.email = 'suspicious@example.com'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- 3. Verificar cambios de roles sospechosos
SELECT * FROM user_role_audit
WHERE user_id = 'suspicious-user-uuid'
  AND created_at > NOW() - INTERVAL '24 hours';
```

### Fase 3: Contención

```sql
-- Opción 1: Deshabilitar cuenta temporalmente
-- (Requiere función custom o update en auth.users via Supabase Dashboard)

-- Opción 2: Revocar todos los roles
DELETE FROM user_roles WHERE user_id = 'suspicious-user-uuid';

-- Opción 3: Marcar sesiones como inválidas
-- (Requiere invalidar JWT tokens via Supabase Dashboard)
```

### Fase 4: Documentación

- Registrar incidente en sistema de tickets (ej: Jira, Linear)
- Documentar acciones tomadas
- Actualizar políticas de seguridad si es necesario

---

## 8. Checklist de Seguridad Mensual

- [ ] Revisar logs de accesos denegados (última semana)
- [ ] Verificar que no hay violaciones de RLS frecuentes
- [ ] Auditar cambios de roles en último mes
- [ ] Revisar usuarios con múltiples intentos de login fallidos
- [ ] Verificar que Leaked Password Protection está habilitado
- [ ] Ejecutar script de testing RLS (`scripts/test-rls.sh`)
- [ ] Revisar políticas RLS para nuevas tablas creadas
- [ ] Verificar que vistas `v_client_*` no exponen datos sensibles
- [ ] Probar rollback de emergencia en ambiente de staging
- [ ] Actualizar documentación de seguridad si hay cambios

---

## 9. Herramientas Recomendadas

### Monitoreo

- **Supabase Dashboard**: Logs nativos de Auth y Postgres
- **Grafana**: Dashboards visuales de métricas
- **Sentry**: Tracking de errores en frontend
- **LogRocket**: Session replay para debugging

### Alertas

- **Slack**: Notificaciones en tiempo real
- **PagerDuty**: Alertas críticas para on-call
- **Discord**: Webhooks para alertas no críticas

### Auditoría

- **Audit Logs Table**: `user_role_audit` custom
- **Supabase Realtime**: Escuchar cambios en tiempo real
- **PostgreSQL Audit Extension**: pgAudit (para logs avanzados)

---

## 10. Referencias

- **RLS Policies**: `docs/RLS_POLICIES.md`
- **Testing Guide**: `docs/RLS_TESTING_GUIDE.md`
- **Client Views**: `docs/CLIENT_VIEWS_SECURITY.md`
- **Emergency Procedures**: `docs/RLS_EMERGENCY_PROCEDURES.md`

---

**Última actualización**: 2025-01-11  
**Responsable**: Equipo de Seguridad Dovita Core  
**Revisión próxima**: 2025-02-11

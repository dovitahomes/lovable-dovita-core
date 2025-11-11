# Vistas de Cliente - Documentación de Seguridad

## Resumen Ejecutivo

Las vistas de cliente (`v_client_*`) son una **capa adicional de seguridad** diseñada específicamente para filtrar datos sensibles antes de exponerlos a la Client App. Estas vistas complementan (no reemplazan) las políticas RLS existentes.

## Arquitectura de Seguridad en Capas

```
┌─────────────────────────────────────────────────┐
│  Client App (React)                              │
│  - Consume vistas v_client_* vía hooks           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Vistas SECURITY DEFINER (v_client_*)            │
│  - Filtran columnas sensibles                    │
│  - Aplican lógica de negocio específica          │
│  - Formatean datos para UI                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Políticas RLS en Tablas Base                    │
│  - Verifican participación en proyecto           │
│  - Validan roles (admin/colaborador/cliente)     │
│  - Controlan CRUD según permisos                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Tablas Base (projects, budgets, etc.)           │
│  - Datos crudos sin filtrar                      │
└─────────────────────────────────────────────────┘
```

## Vistas Implementadas

### 1. `v_client_projects`

**Propósito**: Exponer proyectos del cliente con información visible en su dashboard.

**Columnas Expuestas**:
- `id` - UUID del proyecto
- `project_name` - Nombre del proyecto
- `client_id` - ID del cliente propietario
- `client_name` - Nombre del cliente
- `status` - Estado actual (diseño/presupuesto/construcción/etc.)
- `created_at` - Fecha de creación
- `updated_at` - Última actualización

**Columnas OCULTADAS**:
- `sales_advisor_id` - Asignaciones internas
- `internal_notes` - Notas privadas del equipo
- Cualquier campo de costos internos

**Filtrado**:
```sql
WHERE client_id IN (
  SELECT id FROM clients WHERE email = auth.jwt()->>'email'
)
```

### 2. `v_client_events`

**Propósito**: Mostrar eventos/citas visibles para el cliente.

**Columnas Expuestas**:
- `id`, `title`, `start_time`, `end_time`
- `description`, `location`
- `status` (propuesta/aceptada/rechazada)
- `event_type` (meeting/site_visit/review/deadline)
- `project_id`, `created_by`, `created_by_name`

**Filtrado Crítico**:
```sql
WHERE visibility = 'client'
AND project_id IN (user's projects)
AND end_time >= now() -- Solo eventos futuros/actuales
```

**Eventos EXCLUIDOS**:
- Eventos con `visibility = 'team'` (internos)
- Eventos de proyectos no asignados al cliente
- Eventos pasados (opcional según lógica de negocio)

### 3. `v_client_financial_summary`

**Propósito**: Resumen financiero sin exponer datos sensibles de costos.

**Columnas Expuestas**:
- `project_id`, `client_id`, `client_name`
- `total_deposits` - Depósitos del cliente
- `total_expenses` - Gastos totales (visibles)
- `balance` - Saldo pendiente
- `mayor_id`, `mayor_code`, `mayor_name` - Categorías
- `mayor_expense` - Gasto por categoría

**Columnas OCULTADAS**:
- Costos de proveedores específicos
- Márgenes de utilidad
- Honorarios internos
- Desperdicio de materiales
- Cualquier dato que revele estructura de costos

**Cálculo Seguro**:
```sql
-- Solo muestra gastos aprobados y publicados
WHERE budget.status = 'publicado'
AND budget.visibility = 'client'
```

### 4. `v_client_budget_items`

**Propósito**: Partidas presupuestarias visibles al cliente (versión pública).

**Columnas Expuestas**:
- `id`, `budget_id`, `project_id`
- `mayor_id`, `partida_id`, `subpartida_id`
- `descripcion`, `unidad`, `cantidad`
- `precio_unitario` - **Precio FINAL sin desglose**
- `total` - Total a pagar

**Columnas OCULTADAS**:
- `costo_real` - Costo interno
- `percent_desperdicio` - Desperdicio
- `percent_honorarios` - Honorarios
- `proveedor_tag` - Proveedor específico
- Cualquier campo que exponga la estructura de costos

**Lógica de Negocio**:
```sql
-- precio_unitario mostrado incluye:
-- = costo_real * (1 + desperdicio) * (1 + honorarios) * (1 + IVA)
-- Pero el cliente solo ve el precio final, no el desglose
```

### 5. Otras Vistas de Cliente

- `v_client_ministrations` - Calendario de pagos sin detalles de comisiones
- `v_client_documents` - Documentos compartidos con cliente
- `v_client_photos` - Fotos de obra con geolocalización

## ¿Por Qué SECURITY DEFINER?

### Propósito de `SECURITY DEFINER`

Las vistas usan `SECURITY DEFINER` para:

1. **Ejecutar con privilegios elevados**: Permiten a clientes leer datos que normalmente no tendrían permiso directo de acceder.

2. **Centralizar lógica de filtrado**: En lugar de confiar en que cada query en el frontend filtre correctamente, la vista garantiza el filtrado.

3. **Simplificar políticas RLS**: Las políticas en las tablas base pueden ser más simples porque la vista ya aplicó filtros específicos.

### ⚠️ Advertencias de Linter (ESPERADAS)

El linter de Supabase reportará:

```
❌ Security Definer Views (22 warnings)
```

**Esto es CORRECTO y ESPERADO**. Las vistas `v_client_*` **DEBEN** ser `SECURITY DEFINER` para funcionar correctamente.

### Mitigación de Riesgos

Para usar `SECURITY DEFINER` de forma segura:

1. ✅ **Filtrado Explícito**: Cada vista filtra por `client_id` o `project_id` del usuario autenticado.

2. ✅ **Columnas Mínimas**: Solo se exponen columnas necesarias, nunca `SELECT *`.

3. ✅ **Validación de Auth**: Todas usan `auth.jwt()->>'email'` o `auth.uid()` para identificar al usuario.

4. ✅ **Sin Parámetros de Usuario**: No aceptan parámetros que puedan ser manipulados para inyección SQL.

5. ✅ **Auditoría Regular**: Revisar periódicamente qué datos expone cada vista.

## Ejemplo de Uso Correcto

### ❌ INCORRECTO - Query Directo

```typescript
// MAL: Cliente puede acceder a datos de otros proyectos si RLS falla
const { data } = await supabase
  .from('budget_items')
  .select('*, costo_real, percent_honorarios') // ¡Expone datos sensibles!
  .eq('project_id', projectId);
```

### ✅ CORRECTO - Via Vista de Cliente

```typescript
// BIEN: Vista filtra automáticamente y oculta columnas sensibles
const { data } = await supabase
  .from('v_client_budget_items')
  .select('*')
  .eq('project_id', projectId);
// Solo retorna precio_unitario final, NO costo_real ni honorarios
```

## Testing de Vistas

### 1. Testing de Filtrado

```sql
-- Como cliente, verificar que solo veo mis proyectos
SET LOCAL "request.jwt.claims" = '{"email": "cliente@example.com", "sub": "uuid-cliente"}';

SELECT * FROM v_client_projects;
-- Debe retornar SOLO proyectos donde client.email = 'cliente@example.com'

SELECT * FROM v_client_projects WHERE client_id != (SELECT id FROM clients WHERE email = 'cliente@example.com');
-- Debe retornar 0 filas (no puede ver proyectos de otros)
```

### 2. Testing de Columnas Ocultas

```sql
-- Verificar que columnas sensibles NO estén en la vista
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'v_client_budget_items'
AND column_name IN ('costo_real', 'percent_desperdicio', 'percent_honorarios', 'proveedor_tag');
-- Debe retornar 0 filas
```

### 3. Testing de SECURITY DEFINER

```sql
-- Como cliente sin permisos directos en budget_items, debería poder leer via vista
SET LOCAL "request.jwt.claims" = '{"email": "cliente@example.com", "sub": "uuid-cliente"}';

-- Esto debe FALLAR (sin vista)
SELECT * FROM budget_items WHERE project_id = 'uuid-proyecto-del-cliente';
-- Error: permission denied (RLS bloquea)

-- Esto debe FUNCIONAR (con vista)
SELECT * FROM v_client_budget_items WHERE project_id = 'uuid-proyecto-del-cliente';
-- Retorna datos filtrados correctamente
```

## Mantenimiento

### Al Agregar Nuevos Campos

**SIEMPRE preguntarse**:

1. ¿Este campo contiene información sensible?
2. ¿El cliente necesita ver este dato?
3. ¿Exponer este dato revela estructura de costos o márgenes?

### Checklist de Nueva Vista

- [ ] Usa `SECURITY DEFINER` solo si es necesario
- [ ] Filtra explícitamente por `client_id` o `project_id` del usuario autenticado
- [ ] Lista columnas específicas, nunca `SELECT *`
- [ ] Oculta costos internos, márgenes, honorarios, desperdicio
- [ ] Documenta en este archivo qué columnas expone y cuáles oculta
- [ ] Agrega tests de filtrado y columnas
- [ ] Revisa que el hook correspondiente en `src/hooks/` consuma la vista

## Referencias

- **RLS Policies**: `docs/RLS_POLICIES.md`
- **Client App Data**: `docs/CLIENT_APP_DATA.md`
- **Testing Guide**: `docs/RLS_TESTING_GUIDE.md`
- **Performance**: `docs/PERFORMANCE_OPTIMIZATION.md`

---

**Última actualización**: 2025-01-11  
**Responsable**: Equipo de Seguridad Dovita Core

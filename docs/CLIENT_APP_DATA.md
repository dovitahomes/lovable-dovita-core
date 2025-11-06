# Client App - Arquitectura de Datos

## 📋 Resumen Ejecutivo

El **Client App** es un portal web progresivo (PWA) que permite a los clientes de Dovita visualizar en tiempo real el progreso de sus proyectos de construcción. Actualmente funciona con **dos fuentes de datos**:

1. **Mock Data** (datos simulados para desarrollo/demo)
2. **Real Data** (datos reales desde Supabase via vistas especializadas)

El sistema es **dual-source** y puede cambiar entre ambas fuentes dinámicamente usando la **PreviewBar** (en modo preview) o consumir automáticamente datos reales cuando un cliente real inicia sesión.

---

## 🏗️ Arquitectura de Datos

### Sistema de Fuentes de Datos (`DataSourceContext`)

**Archivo**: `src/contexts/client-app/DataSourceContext.tsx`

Este contexto administra:

```typescript
type DataSource = 'mock' | 'real';

interface DataSourceContextType {
  source: DataSource;                    // Fuente activa
  setSource: (source: DataSource) => void;
  forceClientId: string | null;          // Cliente forzado en preview
  setForceClientId: (id: string | null) => void;
  isPreviewMode: boolean;                // Si está en modo preview
}
```

**Persistencia en localStorage**:
- `clientapp.useMock` → `'true'` | `'false'`
- `clientapp.forceClientId` → UUID del cliente seleccionado
- `clientapp.previewMode` → `'true'` si está en preview

**Flujo de selección de fuente**:
1. Si `isPreviewMode === true` y `forceClientId` está configurado → usa `real` con ese cliente
2. Si `isPreviewMode === true` y NO hay clientes reales → auto-corrige a `mock`
3. Si NO está en preview → usa sesión autenticada (Supabase Auth)

---

## 📊 Estructura de Datos Mock

**Archivo**: `src/lib/client-app/client-data.ts`

### Mock Data Structure

```typescript
export const mockClientData = {
  clientId: "client_1",
  clientName: "Familia Martínez",
  projects: [
    {
      // Proyecto 1: Casa en Juriquilla (en construcción)
      id: "project_juriquilla",
      clientName: "Familia Martínez",
      name: "Casa Residencial Juriquilla",
      location: "Juriquilla, Querétaro",
      progress: 45,
      currentPhase: "Estructura",
      projectStage: "construction",
      totalAmount: 4500000,
      totalPaid: 2250000,
      totalPending: 2250000,
      startDate: "2024-03-15",
      estimatedEndDate: "2025-03-15",
      heroImage: "...",
      renders: [...],        // Renders 3D (3 imágenes)
      team: [...],           // Equipo del proyecto (3 miembros)
      documents: [...],      // 12 documentos categorizados
      phases: [...]          // 7 fases del proyecto
    },
    {
      // Proyecto 2: Casa en Playa del Carmen (en diseño)
      id: "project_playa",
      // ... similar estructura
      projectStage: "design",
      phases: [...]          // 5 fases de diseño
    }
  ]
};
```

### Datos Relacionados (Mock)

```typescript
// Fotos de construcción (5 fotos totales, 3 por proyecto)
export const mockPhotos = [
  {
    id: 1,
    projectId: "project_juriquilla",
    url: "...",
    phase: "Cimentación",
    date: "2024-04-10",
    description: "Excavación completada y cimbra instalada",
    location: { lat: 20.5888, lng: -100.3899 }
  },
  // ...
];

// Ministraciones (7 totales, 4 para Juriquilla, 3 para Playa)
export const mockMinistraciones = [
  {
    id: 1,
    projectId: "project_juriquilla",
    amount: 450000,
    date: "2024-03-15",
    status: "paid",
    concept: "Anticipo - Diseño Arquitectónico"
  },
  // ...
];

// Citas (5 totales)
export const mockAppointments = [
  {
    id: 1,
    projectId: "project_juriquilla",
    type: "Revisión de Avances",
    date: "2025-11-05",
    time: "10:00",
    duration: 60,
    status: "confirmed",
    teamMember: { id, name, role, avatar },
    location: "Obra - Casa Juriquilla",
    notes: "...",
    isVirtual: false
  },
  // ...
];

// Categorías de presupuesto (10 totales, 5 por proyecto)
export const budgetCategories = [
  {
    projectId: "project_juriquilla",
    name: "Materiales",
    budgeted: 1800000,
    spent: 850000
  },
  // ...
];

// Mensajes de chat (12 totales)
export const mockChatMessages = [
  {
    id: 1,
    projectId: "project_juriquilla",
    content: "Buenos días familia Martínez...",
    timestamp: "2025-10-28T09:30:00",
    isClient: false,
    sender: { name, avatar, role },
    status: "read"
  },
  // ...
];
```

---

## 🗄️ Estructura de Datos Reales (Supabase)

### Vistas SQL para Client App

**Archivo**: `supabase/migrations/20251105215522_f7ed0727-c948-4c15-809e-6f8d52ce1fff.sql`

#### 1. `v_client_projects` - Listado de Proyectos

**Propósito**: Devuelve todos los proyectos de un cliente.

```sql
SELECT
  p.id            AS project_id,
  p.client_id     AS client_id,
  'PRJ-' || SUBSTRING(p.id::text, 1, 8) AS project_code,
  COALESCE(c.name, 'Proyecto sin nombre') AS project_name,
  COALESCE(p.status::text, 'activo') AS status,
  p.created_at,
  p.ubicacion_json,
  p.terreno_m2
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id;
```

**Campos necesarios del ERP**:
- ✅ `projects.id` (UUID)
- ✅ `projects.client_id` (UUID) → FK a `clients.id`
- ✅ `projects.status` (text)
- ✅ `projects.created_at` (timestamp)
- ✅ `projects.ubicacion_json` (JSONB) → debe tener `{ formatted: "Calle X, Ciudad" }`
- ✅ `projects.terreno_m2` (numeric)
- ✅ `clients.name` (text)

---

#### 2. `v_client_project_summary` - Resumen del Proyecto

**Propósito**: Dashboard principal con fechas, progreso, totales financieros.

```sql
SELECT
  p.id AS project_id,
  COALESCE(c.name, 'Proyecto') AS project_name,
  COALESCE(bt.total_amount, 0) AS total_amount,
  COALESCE(pay.total_paid, 0) AS total_paid,
  COALESCE(bt.total_amount - pay.total_paid, 0) AS total_pending,
  g.start_date,
  g.end_date AS estimated_end_date,
  COALESCE(progress_calc, 0) AS progress_percent,
  pay.last_payment_at,
  p.status
FROM public.projects p
LEFT JOIN budget_totals bt ON bt.project_id = p.id
LEFT JOIN gantt_dates g ON g.project_id = p.id
LEFT JOIN payments pay ON pay.project_id = p.id;
```

**Fuentes de datos requeridas**:

**A. Presupuesto Total**:
- ✅ `budgets.project_id`
- ✅ `budgets.type` = `'ejecutivo'`
- ✅ `budgets.status` = `'publicado'`
- ✅ `budget_items.total` → sumar para obtener total

**B. Fechas del Gantt**:
- ✅ `gantt_plans.project_id`
- ✅ `gantt_plans.type` = `'ejecutivo'`
- ✅ `gantt_items.start_date` → MIN para inicio
- ✅ `gantt_items.end_date` → MAX para fin estimado

**C. Progreso**:
- ❓ **PENDIENTE**: El cálculo de `progress_percent` necesita una lógica definida
- **Opciones**:
  1. Manual: `projects.progress_override` (campo nuevo)
  2. Basado en Gantt: % de `gantt_items` completados
  3. Basado en presupuesto: % gastado vs. total
  
**D. Pagos Totales**:
- ✅ `invoices.receptor_id` = `client_id` del proyecto
- ✅ `invoices.tipo` = `'ingreso'`
- ✅ `invoices.paid` = `true`
- ✅ Sumar `invoices.total_amount`

---

#### 3. `v_client_documents` - Documentos Visibles

```sql
SELECT
  d.id         AS doc_id,
  d.project_id,
  d.nombre     AS name,
  d.file_url   AS storage_path,
  d.file_type  AS mime_type,
  d.file_size,
  d.created_at AS uploaded_at,
  d.visibilidad AS visibility,
  d.tipo_carpeta AS category,
  d.etiqueta AS label
FROM public.documents d
WHERE COALESCE(d.visibilidad, 'cliente') = 'cliente';
```

**Campos requeridos**:
- ✅ `documents.id`
- ✅ `documents.project_id`
- ✅ `documents.nombre`
- ✅ `documents.file_url` → path en Supabase Storage
- ✅ `documents.file_type` → MIME type (e.g., `'application/pdf'`, `'image/jpeg'`)
- ✅ `documents.file_size` → bytes
- ✅ `documents.created_at`
- ✅ `documents.visibilidad` → `'cliente'` | `'interno'`
- ✅ `documents.tipo_carpeta` → categoría (ver mapeo abajo)

**Mapeo de categorías**:
```typescript
'documentos_cliente' → 'cliente'
'identificaciones'   → 'cliente'
'planos'            → 'proyecto'
'especificaciones'  → 'proyecto'
'contratos'         → 'legal'
'permisos'          → 'legal'
'renders'           → 'diseno'
'diseno_interior'   → 'diseno'
'bitacora'          → 'construccion'
'avances'           → 'construccion'
```

---

#### 4. `v_client_photos` - Fotos de Construcción

```sql
SELECT
  p.id            AS photo_id,
  p.project_id,
  p.file_url      AS storage_path,
  p.descripcion   AS caption,
  p.fecha_foto    AS taken_at,
  p.visibilidad   AS visibility,
  p.latitude,
  p.longitude,
  'Construcción'::text AS phase_name
FROM public.construction_photos p
WHERE COALESCE(p.visibilidad, 'cliente') = 'cliente';
```

**Campos requeridos**:
- ✅ `construction_photos.id`
- ✅ `construction_photos.project_id`
- ✅ `construction_photos.file_url` → path en Storage
- ✅ `construction_photos.descripcion` → descripción de la foto
- ✅ `construction_photos.fecha_foto` → timestamp
- ✅ `construction_photos.visibilidad` → `'cliente'` | `'interno'`
- ✅ `construction_photos.latitude` → coordenadas GPS (opcional)
- ✅ `construction_photos.longitude`

**⚠️ PENDIENTE**: Vincular a fases de diseño (`design_phases`) para mostrar "Cimentación", "Estructura", etc.

---

#### 5. `v_client_appointments` - Agenda de Citas

```sql
SELECT
  ce.id        AS appointment_id,
  ce.project_id,
  COALESCE(ce.title, 'Cita') AS title,
  ce.start_at  AS starts_at,
  ce.end_at    AS ends_at,
  NULL::text   AS location,  -- ❌ FALTA CAMPO
  ce.notes,
  ce.attendees
FROM public.calendar_events ce
WHERE ce.project_id IS NOT NULL;
```

**Campos actuales**:
- ✅ `calendar_events.id`
- ✅ `calendar_events.project_id`
- ✅ `calendar_events.title`
- ✅ `calendar_events.start_at`
- ✅ `calendar_events.end_at`
- ✅ `calendar_events.notes`
- ✅ `calendar_events.attendees` (JSONB array)

**❌ CAMPOS FALTANTES en `calendar_events`**:
- `location` (text) → "Oficina Dovita", "Obra", "Virtual - Google Meet"
- `meeting_link` (text) → URL si es reunión virtual
- `visibility` (text) → `'cliente'` | `'interno'` para filtrar

**Sugerencia**: Agregar campos a `calendar_events`:
```sql
ALTER TABLE calendar_events
  ADD COLUMN location text,
  ADD COLUMN meeting_link text,
  ADD COLUMN visibility text DEFAULT 'cliente';
```

---

#### 6. `v_client_ministrations` - Ministraciones del Gantt

```sql
SELECT
  gp.project_id,
  gm.order_index AS seq,
  COALESCE(gm.label, 'Ministración ' || gm.order_index::text) AS label,
  COALESCE(gm.percent, 0) AS percent,
  COALESCE(gm.accumulated_percent, 0) AS cumulative_percent,
  gm.alcance AS notes,
  gm.date AS date
FROM public.gantt_ministrations gm
JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
WHERE gp.type = 'ejecutivo';
```

**Campos requeridos**:
- ✅ `gantt_plans.project_id`
- ✅ `gantt_plans.type` = `'ejecutivo'`
- ✅ `gantt_ministrations.order_index` → orden de la ministración
- ✅ `gantt_ministrations.label` → "Primera Ministración", "Anticipo", etc.
- ✅ `gantt_ministrations.percent` → % del total (e.g., 20%)
- ✅ `gantt_ministrations.accumulated_percent` → acumulado
- ✅ `gantt_ministrations.date` → fecha programada
- ✅ `gantt_ministrations.alcance` → descripción opcional

**❓ DATO FALTANTE**: Estado de pago (`paid`, `pending`, `future`)
- **Solución propuesta**: Comparar `gantt_ministrations.date` con facturas pagadas
- Agregar campo `gantt_ministrations.invoice_id` (FK a `invoices`)

---

#### 7. `v_client_financial_summary` - Resumen Financiero

```sql
SELECT
  p.id AS project_id,
  COALESCE(bt.total_amount, 0) AS total_amount,
  COALESCE(pay.paid_amount, 0) AS paid_amount,
  COALESCE(bt.total_amount - pay.paid_amount, 0) AS pending_amount,
  COALESCE(exp.spent_amount, 0) AS spent_amount,
  pay.last_payment_at
FROM public.projects p
LEFT JOIN budget_totals bt
LEFT JOIN payments pay
LEFT JOIN expenses exp;
```

**Campos calculados**:
- `total_amount` → suma de `budget_items.total` (presupuesto ejecutivo publicado)
- `paid_amount` → suma de `invoices` donde `tipo='ingreso'` AND `paid=true`
- `pending_amount` → `total_amount - paid_amount`
- `spent_amount` → suma de egresos reales (órdenes de compra pagadas)
- `last_payment_at` → MAX de `invoices.paid_at`

---

#### 8. `v_client_budget_categories` - Desglose Presupuestal

```sql
SELECT
  b.project_id,
  bi.mayor_id,
  tn.name AS mayor_name,
  SUM(bi.total) AS budgeted,
  SUM(spent_by_po) AS spent
FROM public.budgets b
JOIN public.budget_items bi ON bi.budget_id = b.id
LEFT JOIN tu_nodes tn ON tn.id = bi.mayor_id
WHERE b.type = 'ejecutivo' AND b.status = 'publicado'
GROUP BY b.project_id, bi.mayor_id, tn.name;
```

**Campos requeridos**:
- ✅ `budgets.project_id`
- ✅ `budgets.type` = `'ejecutivo'`
- ✅ `budgets.status` = `'publicado'`
- ✅ `budget_items.mayor_id` → FK a `tu_nodes` (Transacciones Unificadas)
- ✅ `budget_items.total` → total presupuestado
- ✅ `tu_nodes.name` → "Materiales", "Mano de Obra", etc.

**❓ DATO FALTANTE**: Gasto real por mayor
- **Solución**: Sumar `purchase_orders.total` donde `mayor_id` coincide y `status='pagada'`

---

## 🔄 Mapeo de Datos: Mock → Real

| Mock Field | Real Source | Notes |
|------------|-------------|-------|
| `project.id` | `projects.id` | UUID directo |
| `project.clientName` | `clients.name` | JOIN via `client_id` |
| `project.name` | `projects.name` o derivado de `clients.name` | "Casa {ClientName}" |
| `project.location` | `projects.ubicacion_json.formatted` | JSONB field |
| `project.progress` | ❓ Calculado | Ver opciones arriba |
| `project.currentPhase` | ❓ Derivado | Basado en `progress` o gantt |
| `project.projectStage` | `projects.status` | Mapeo: `'diseno'` → `'design'`, resto → `'construction'` |
| `project.totalAmount` | `SUM(budget_items.total)` | Presupuesto ejecutivo publicado |
| `project.totalPaid` | `SUM(invoices.total_amount)` WHERE `paid=true` | Facturas de ingreso pagadas |
| `project.totalPending` | `totalAmount - totalPaid` | Calculado |
| `project.startDate` | `MIN(gantt_items.start_date)` | Fecha inicio del gantt |
| `project.estimatedEndDate` | `MAX(gantt_items.end_date)` | Fecha fin del gantt |
| `project.heroImage` | `construction_photos.file_url` (más reciente) | Foto más reciente o render |
| `project.renders` | `documents` WHERE `category='renders'` | Imágenes de diseño |
| `project.team` | ❌ FALTA TABLA | Ver propuesta abajo |
| `project.documents` | `v_client_documents` | Direct mapping |
| `project.phases` | ❓ Generado | Basado en `gantt_items` o manual |

---

## 📝 Datos Faltantes en el ERP

### Críticos (🔴 Sin estos, el Client App no funcionará completamente)

1. **`projects.progress_override` (numeric)**
   - Permite override manual del % de progreso
   - Si NULL, calcular automáticamente

2. **`calendar_events.location` (text)**
   - Ubicación de la cita

3. **`calendar_events.meeting_link` (text)**
   - URL para reuniones virtuales

4. **`calendar_events.visibility` (text)**
   - Filtro `'cliente'` | `'interno'`

5. **Tabla `project_members`** (nuevo)
   ```sql
   CREATE TABLE project_members (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     role TEXT NOT NULL, -- 'Arquitecto Líder', 'Ingeniero de Obra', etc.
     avatar_url TEXT,
     phone TEXT,
     email TEXT,
     is_visible_to_client BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

6. **`gantt_ministrations.invoice_id` (UUID nullable)**
   - FK a `invoices` para saber si está pagada

### Deseables (🟡 Mejoran UX pero no son bloqueantes)

1. **`construction_photos.phase_id` (UUID)**
   - FK a `design_phases` para asociar fotos a fases

2. **`projects.hero_image_override` (text)**
   - Path manual de imagen hero (si no quiere usar fotos/renders)

3. **`chat_messages` (tabla de mensajes)**
   ```sql
   CREATE TABLE chat_messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
     sender_id UUID REFERENCES auth.users(id),
     message TEXT NOT NULL,
     is_client BOOLEAN DEFAULT false,
     read_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

4. **Vista `v_client_chat_messages`**
   - Agregar nombres y avatares de `profiles`

---

## 🚀 Hooks y Consumo de Datos

### Hooks Unificados (`useUnifiedClientData.ts`)

Estos hooks **automáticamente** cambian entre mock y real según `DataSourceContext`:

```typescript
// ✅ Documentos
const { data, isLoading, source } = useUnifiedDocuments(projectId);

// ✅ Fotos
const { data, isLoading, source } = useUnifiedPhotos(projectId);

// ✅ Ministraciones
const { data, isLoading, source } = useUnifiedMinistrations(projectId);

// ✅ Resumen Financiero
const { data, isLoading, source } = useUnifiedFinancialSummary(projectId);

// ✅ Categorías Presupuestales
const { data, isLoading, source } = useUnifiedBudgetCategories(projectId);

// ✅ Citas
const { data, isLoading, source } = useUnifiedAppointments(projectId);
```

**Lógica interna**:
```typescript
export function useUnifiedDocuments(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realDocs = [], isLoading } = useClientDocuments(projectId);
  
  if (source === 'mock') {
    const mockProject = mockClientData.projects.find(p => p.id === projectId);
    return {
      data: mockProject?.documents || [],
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realDocs,
    isLoading,
    source: 'real' as const,
  };
}
```

---

## 📚 Adaptadores de Datos (`dataAdapters.ts`)

Transforman datos de Supabase al formato esperado por el UI:

### `transformProjectToUI`
```typescript
export function transformProjectToUI(
  project: ClientProject,
  summary?: ClientProjectSummary | null,
  documents?: ClientDocument[],
  photos?: ClientPhoto[]
): Project {
  return {
    id: project.project_id,
    clientName: project.client_name || 'Cliente',
    name: `Casa ${project.client_name || 'Cliente'}`,
    location: project.ubicacion_json?.direccion || 'Sin ubicación',
    progress: summary?.progress_percent || 0,
    currentPhase: determineCurrentPhase(summary?.progress_percent, project.project_status),
    projectStage: determineProjectStage(project.project_status),
    totalAmount: summary?.total_amount || 0,
    totalPaid: summary?.total_paid || 0,
    totalPending: summary?.total_pending || 0,
    startDate: summary?.start_date || project.created_at,
    estimatedEndDate: summary?.estimated_end_date || '',
    heroImage: photos?.[0]?.storage_path || defaultHeroImage,
    renders: transformPhotosToRenders(photos || []),
    team: generateDefaultTeam(), // ❌ TEMPORAL - necesita project_members
    documents: transformDocuments(documents || []),
    phases: generatePhasesFromProgress(summary?.progress_percent || 0),
  };
}
```

**Funciones auxiliares**:
- `determineCurrentPhase(progress, status)` → Mapea % a "Diseño", "Cimentación", etc.
- `determineProjectStage(status)` → Mapea status a `'design'` | `'construction'`
- `transformDocuments(docs)` → Convierte bytes a "MB", formatea fechas
- `transformPhotosToRenders(photos)` → Convierte fotos a formato de renders
- `generatePhasesFromProgress(progress)` → Crea array de fases basado en %

---

## 🎯 Plan de Implementación: Mock → Real

### Fase 1: Datos Básicos (✅ Implementado)
- [x] Vistas SQL creadas
- [x] Hooks de consumo (`useClientData.ts`)
- [x] Sistema dual-source (`DataSourceContext`)
- [x] Preview mode con selección de cliente

### Fase 2: Completar Datos Faltantes (🔴 Requerido)

**2.1. Extender `calendar_events`**
```sql
ALTER TABLE calendar_events
  ADD COLUMN location text,
  ADD COLUMN meeting_link text,
  ADD COLUMN visibility text DEFAULT 'cliente';

-- Actualizar vista
CREATE OR REPLACE VIEW v_client_appointments AS
SELECT
  ce.id AS appointment_id,
  ce.project_id,
  ce.title,
  ce.start_at AS starts_at,
  ce.end_at AS ends_at,
  ce.location,
  ce.meeting_link,
  ce.notes,
  ce.attendees
FROM public.calendar_events ce
WHERE ce.project_id IS NOT NULL
  AND COALESCE(ce.visibility, 'cliente') = 'cliente';
```

**2.2. Crear tabla `project_members`**
```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  is_visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
```

**2.3. Crear vista `v_client_team`**
```sql
CREATE OR REPLACE VIEW v_client_team AS
SELECT
  pm.project_id,
  pm.id AS member_id,
  pm.name,
  pm.role,
  COALESCE(pm.avatar_url, p.avatar_url) AS avatar,
  pm.phone,
  pm.email
FROM project_members pm
LEFT JOIN profiles p ON p.id = pm.user_id
WHERE pm.is_visible_to_client = true;
```

**2.4. Agregar campo `projects.progress_override`**
```sql
ALTER TABLE projects
  ADD COLUMN progress_override NUMERIC(5,2) CHECK (progress_override >= 0 AND progress_override <= 100);

COMMENT ON COLUMN projects.progress_override IS 'Override manual del % de progreso. Si NULL, se calcula automáticamente.';
```

**2.5. Vincular ministraciones a facturas**
```sql
ALTER TABLE gantt_ministrations
  ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Actualizar vista para incluir estado de pago
CREATE OR REPLACE VIEW v_client_ministrations AS
SELECT
  gp.project_id,
  gm.order_index AS seq,
  gm.label,
  gm.percent,
  gm.accumulated_percent,
  gm.date,
  gm.alcance AS notes,
  CASE
    WHEN gm.invoice_id IS NOT NULL AND i.paid = true THEN 'paid'
    WHEN gm.date <= CURRENT_DATE THEN 'pending'
    ELSE 'future'
  END AS status
FROM gantt_ministrations gm
JOIN gantt_plans gp ON gp.id = gm.gantt_id
LEFT JOIN invoices i ON i.id = gm.invoice_id
WHERE gp.type = 'ejecutivo';
```

**2.6. Crear tabla de chat (opcional pero recomendado)**
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_client BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_project ON chat_messages(project_id, created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(project_id) WHERE read_at IS NULL;

-- Vista con info del sender
CREATE OR REPLACE VIEW v_client_chat AS
SELECT
  cm.id AS message_id,
  cm.project_id,
  cm.message,
  cm.is_client,
  cm.created_at AS timestamp,
  cm.read_at,
  CASE WHEN cm.read_at IS NOT NULL THEN 'read' ELSE 'delivered' END AS status,
  CASE
    WHEN cm.is_client THEN NULL
    ELSE jsonb_build_object(
      'name', COALESCE(p.full_name, p.email, 'Usuario'),
      'avatar', p.avatar_url,
      'role', pm.role
    )
  END AS sender
FROM chat_messages cm
LEFT JOIN profiles p ON p.id = cm.sender_id
LEFT JOIN project_members pm ON pm.user_id = cm.sender_id AND pm.project_id = cm.project_id
ORDER BY cm.created_at ASC;
```

### Fase 3: Lógica de Progreso (🟡 Importante)

**Opción A: Manual Override**
```sql
-- Ya implementado con progress_override
UPDATE projects SET progress_override = 45 WHERE id = 'project-uuid';
```

**Opción B: Basado en Gantt (automático)**
```sql
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total_items INT;
  v_completed_items INT;
BEGIN
  -- Obtener gantt ejecutivo del proyecto
  SELECT COUNT(*), COUNT(*) FILTER (WHERE gi.end_date < CURRENT_DATE)
  INTO v_total_items, v_completed_items
  FROM gantt_items gi
  JOIN gantt_plans gp ON gp.id = gi.gantt_id
  WHERE gp.project_id = p_project_id AND gp.type = 'ejecutivo';
  
  IF v_total_items = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_completed_items::numeric / v_total_items::numeric) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Actualizar vista para usar función
CREATE OR REPLACE VIEW v_client_project_summary AS
SELECT
  ...
  COALESCE(
    p.progress_override,
    calculate_project_progress(p.id)
  ) AS progress_percent,
  ...
FROM projects p;
```

### Fase 4: Testing y Migración (🟢 Final)

**4.1. Poblar datos de prueba**
```sql
-- Insertar miembros del equipo
INSERT INTO project_members (project_id, name, role, phone, email, avatar_url)
VALUES
  ('project-uuid', 'Arq. Carlos Mendoza', 'Arquitecto Líder', '+52 442 123 4567', 'carlos@dovita.mx', '...'),
  ('project-uuid', 'Ing. Laura Ramírez', 'Ingeniera de Obra', '+52 442 234 5678', 'laura@dovita.mx', '...');

-- Actualizar ubicaciones
UPDATE projects
SET ubicacion_json = jsonb_build_object(
  'formatted', 'Juriquilla, Querétaro',
  'ciudad', 'Querétaro',
  'estado', 'Querétaro'
)
WHERE id = 'project-uuid';

-- Marcar documentos como visibles
UPDATE documents SET visibilidad = 'cliente' WHERE tipo_carpeta IN ('planos', 'renders');

-- Marcar fotos como visibles
UPDATE construction_photos SET visibilidad = 'cliente';
```

**4.2. Validar datos en cada vista**
```sql
-- Test 1: Proyectos de un cliente
SELECT * FROM v_client_projects WHERE client_id = 'client-uuid';

-- Test 2: Resumen de proyecto
SELECT * FROM v_client_project_summary WHERE project_id = 'project-uuid';

-- Test 3: Documentos
SELECT * FROM v_client_documents WHERE project_id = 'project-uuid';

-- Test 4: Fotos
SELECT * FROM v_client_photos WHERE project_id = 'project-uuid';

-- Test 5: Citas
SELECT * FROM v_client_appointments WHERE project_id = 'project-uuid';

-- Test 6: Ministraciones
SELECT * FROM v_client_ministrations WHERE project_id = 'project-uuid';

-- Test 7: Resumen financiero
SELECT * FROM v_client_financial_summary WHERE project_id = 'project-uuid';

-- Test 8: Categorías presupuestales
SELECT * FROM v_client_budget_categories WHERE project_id = 'project-uuid';
```

**4.3. Habilitar datos reales en Client App**

Desde la **PreviewBar** en `/client?preview=true`:
1. Seleccionar cliente real del dropdown
2. Cambiar toggle de "Mock" a "Real"
3. Verificar que se carguen datos correctamente
4. Si hay errores, revisar logs de Supabase

---

## 📋 Checklist de Implementación

### Datos Críticos (Sin estos NO funciona)
- [ ] `calendar_events.location`
- [ ] `calendar_events.meeting_link`
- [ ] `calendar_events.visibility`
- [ ] Tabla `project_members` con vista `v_client_team`
- [ ] `projects.progress_override` o lógica de cálculo automático
- [ ] `gantt_ministrations.invoice_id` para estado de pago

### Datos Deseables (Mejoran UX)
- [ ] `construction_photos.phase_id`
- [ ] `projects.hero_image_override`
- [ ] Tabla `chat_messages` con vista `v_client_chat`
- [ ] Función `calculate_project_progress()`

### Validación de Vistas
- [ ] `v_client_projects` devuelve proyectos correctos
- [ ] `v_client_project_summary` tiene todos los campos
- [ ] `v_client_documents` filtra por visibilidad
- [ ] `v_client_photos` tiene URLs válidas
- [ ] `v_client_appointments` incluye location
- [ ] `v_client_ministrations` tiene status correcto
- [ ] `v_client_financial_summary` suma correctamente
- [ ] `v_client_budget_categories` agrupa por mayor

### Testing en Client App
- [ ] Cambiar de Mock a Real en PreviewBar
- [ ] Verificar Dashboard carga datos
- [ ] Verificar Fotos muestra imágenes
- [ ] Verificar Documentos lista archivos
- [ ] Verificar Finanzas muestra totales
- [ ] Verificar Citas aparecen en calendario
- [ ] Verificar Chat (si se implementa)

---

## 🎨 Ejemplos de Uso

### Consumir datos en un componente

```typescript
import { useUnifiedDocuments } from '@/hooks/client-app/useUnifiedClientData';
import { useProject } from '@/contexts/client-app/ProjectContext';

export function DocumentsPage() {
  const { currentProject } = useProject();
  const { data: documents, isLoading, source } = useUnifiedDocuments(currentProject?.id);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        Fuente: {source === 'mock' ? 'Datos de Prueba' : 'Datos Reales'}
      </p>
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
```

### Cambiar fuente de datos programáticamente

```typescript
import { useDataSource } from '@/contexts/client-app/DataSourceContext';

export function SettingsPage() {
  const { source, setSource } = useDataSource();

  return (
    <Switch
      checked={source === 'real'}
      onCheckedChange={(checked) => setSource(checked ? 'real' : 'mock')}
    />
  );
}
```

---

## 🔒 Seguridad y RLS

**IMPORTANTE**: Todas las vistas deben tener políticas RLS para que solo el cliente vea sus datos.

```sql
-- Habilitar RLS en vistas (Postgres 15+)
ALTER VIEW v_client_projects SET (security_invoker = on);
ALTER VIEW v_client_project_summary SET (security_invoker = on);
ALTER VIEW v_client_documents SET (security_invoker = on);
ALTER VIEW v_client_photos SET (security_invoker = on);
ALTER VIEW v_client_appointments SET (security_invoker = on);
ALTER VIEW v_client_ministrations SET (security_invoker = on);
ALTER VIEW v_client_financial_summary SET (security_invoker = on);
ALTER VIEW v_client_budget_categories SET (security_invoker = on);

-- Política en tabla projects (ejemplo)
CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());
```

**Verificar que**:
- ✅ Solo el cliente autenticado puede ver sus proyectos
- ✅ Los colaboradores internos (roles) pueden ver todos los proyectos
- ✅ Los documentos con `visibilidad='interno'` NO se muestran al cliente

---

## 📖 Documentación Relacionada

- [CLIENT_APP_INTEGRATION.md](./CLIENT_APP_INTEGRATION.md) - Guía de integración
- [CLIENT_PORTAL.md](./CLIENT_PORTAL.md) - Guía de usuario del portal
- [DESIGN_SEPARATION.md](./DESIGN_SEPARATION.md) - Separación UI: ERP vs Client App
- [GANTT_MODULE.md](./GANTT_MODULE.md) - Módulo de cronogramas

---

## 🚨 Notas Importantes

1. **No tocar autenticación**: El sistema de auth ya está implementado y funciona
2. **No romper RLS**: Siempre validar que las vistas respeten políticas de seguridad
3. **Mock data es para demo**: En producción, `source` debe ser `'real'` automáticamente
4. **Preview mode es para backoffice**: Permite al equipo interno "ver como cliente"
5. **Signed URLs**: Los archivos en Storage requieren URLs firmadas (ya implementado en `getSignedUrl()`)

---

## ✅ Estado Actual

| Componente | Mock | Real | Notas |
|------------|------|------|-------|
| Listado de proyectos | ✅ | ✅ | `v_client_projects` funcional |
| Resumen de proyecto | ✅ | ✅ | `v_client_project_summary` funcional |
| Documentos | ✅ | ✅ | `v_client_documents` funcional |
| Fotos | ✅ | ✅ | `v_client_photos` funcional |
| Citas | ✅ | ⚠️ | Falta `location` en `calendar_events` |
| Ministraciones | ✅ | ⚠️ | Falta estado de pago |
| Resumen financiero | ✅ | ✅ | `v_client_financial_summary` funcional |
| Categorías presupuesto | ✅ | ✅ | `v_client_budget_categories` funcional |
| Equipo del proyecto | ✅ | ❌ | Falta tabla `project_members` |
| Chat | ✅ | ❌ | Falta tabla `chat_messages` |
| Progreso automático | ✅ | ⚠️ | Necesita lógica de cálculo |

**Leyenda**:
- ✅ Implementado y funcional
- ⚠️ Parcialmente implementado (falta campo/lógica)
- ❌ No implementado

---

**Última actualización**: 2025-11-06  
**Autor**: Sistema Dovita CRM  
**Versión**: 1.0.0

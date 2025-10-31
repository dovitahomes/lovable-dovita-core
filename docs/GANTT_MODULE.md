# Módulo de Cronograma de Gantt

## Descripción General

El módulo de Gantt permite planificar y visualizar el cronograma de proyectos en formato de cuadrícula temporal, con dos modalidades:

- **Paramétrico**: Cronograma independiente, manual, no vinculado a presupuestos ni construcción
- **Ejecutivo**: Cronograma ligado a un proyecto específico y su presupuesto ejecutivo publicado

## Estructura de Base de Datos

### Tablas Principales

#### `gantt_plans`
Almacena cada plan de Gantt creado.

- `id`: UUID único del plan
- `project_id`: UUID del proyecto (FK a `projects`)
- `type`: Enum `'parametrico' | 'ejecutivo'`
- `shared_with_construction`: Boolean, indica si está compartido con Construcción
- `created_at`, `updated_at`: Timestamps

#### `gantt_items`
Elementos individuales del Gantt (barras por Mayor).

- `id`: UUID único
- `gantt_id`: FK a `gantt_plans`
- `major_id`: UUID del Mayor (FK a `tu_nodes`)
- `start_date`: Date de inicio
- `end_date`: Date de fin
- `order_index`: Entero para ordenar filas

#### `gantt_ministrations`
Ministraciones (pagos/hitos) marcados en el cronograma.

- `id`: UUID único
- `gantt_id`: FK a `gantt_plans`
- `date`: Date de la ministración
- `label`: Etiqueta corta (ej. "Ministración 1")
- `percent`: % del total que representa este pago
- `accumulated_percent`: % acumulado hasta este punto
- `alcance`: Texto descriptivo del alcance de esta ministración
- `order_index`: Entero para ordenar

## Componentes React

### `src/pages/construction/GanttPlan.tsx`
Componente principal que renderiza el módulo completo con dos tabs (Paramétrico / Ejecutivo).

**Props**: Ninguno (usa hooks internos)

**Características**:
- Selector de proyecto
- Toolbar con botones: Guardar, Exportar PDF, Compartir con Construcción, Añadir Ministración
- Grid interactivo con drag-and-drop de barras
- Panel de ministraciones con tabla y líneas rojas en el grid
- Resumen de avance con % tiempo, % inversión acumulada

### `src/components/gantt/GanttGrid.tsx`
Grid visual con columnas por semana agrupadas en "Mes 1", "Mes 2", etc.

**Props**:
- `items`: Arreglo de items con datos de Mayor
- `weeks`: Arreglo de semanas calculadas
- `timelineStart`, `timelineEnd`: Fechas límite
- `primaryColor`, `secondaryColor`: Colores del CMS corporativo
- `totalBudget`: Total del presupuesto (para calcular %)
- `onRemoveItem`: Callback para eliminar un item
- `onUpdateItem`: Callback para actualizar (drag/resize)

**Funcionalidad**:
- **Drag**: Mover barra horizontalmente (cambiar inicio/fin manteniendo duración)
- **Resize**: Arrastrar borde derecho de barra para extender/reducir duración

### `src/components/gantt/GanttMinistrations.tsx`
Visualización de ministraciones:
- Líneas verticales rojas en el timeline
- Tabla con detalles: #, Fecha, Etiqueta, %, % Acumulado, Alcance
- Botones para eliminar ministraciones

### `src/components/gantt/GanttSummary.tsx`
Panel de resumen con:
- Avance planeado (tiempo transcurrido vs. total)
- Inversión acumulada programada (% y monto en MXN)
- Próxima ministración
- Detalle de todas las ministraciones

### `src/components/gantt/GanttToolbar.tsx`
Barra de herramientas con:
- Selector de proyecto
- Selector de tipo (Paramétrico / Ejecutivo)
- Botones de acción

### `src/components/gantt/AddMajorSelector.tsx`
Selector para añadir un nuevo Mayor al Gantt (lista solo los Mayores disponibles del presupuesto que aún no están en el cronograma).

## Utilidades

### `src/utils/ganttTime.ts`
Funciones para cálculo temporal:

- `calculateGanttWeeks(startDate, endDate)`: Genera array de `WeekCell` con numeración "Mes 1 S1, S2, S3, S4..."
- `groupWeeksByMonth(weeks)`: Agrupa semanas por mes
- `calculateBarPosition(itemStart, itemEnd, timelineStart, timelineEnd)`: Calcula `{left: %, width: %}` para barras
- `calculateLinePosition(date, timelineStart, timelineEnd)`: Calcula posición de líneas verticales (ministraciones)

### `src/utils/pdf/ganttExport.ts`
Exportación a PDF con `jsPDF` y `jspdf-autotable`.

**Función principal**: `exportGanttToPDF(params)`

**Características**:
- **Formato**: Carta landscape (11" x 8.5")
- **Branding**: Logo, colores y datos del CMS corporativo
- **Secciones**:
  1. Encabezado con logo y datos corporativos
  2. Título del cronograma y datos del proyecto
  3. Tabla Gantt con columnas: #, Mayor, Importe, %, Mes 1..N (divididos en semanas)
  4. Barras azules (█) en celdas correspondientes
  5. Líneas rojas verticales para ministraciones
  6. Resumen de avance (tiempo e inversión)
  7. Tabla de ministraciones programadas
  8. Pie de página

## Hooks

### `src/hooks/useGanttPlan.ts`
- `useGanttPlanByProject(projectId, type)`: Obtiene el último plan de Gantt para un proyecto/tipo
- `useUpsertGanttPlan()`: Mutation para crear o actualizar un plan completo (plan + items + ministraciones)
- `useShareGanttWithConstruction()`: Mutation para marcar `shared_with_construction = true`

### `src/hooks/useBudgetMajors.ts`
- `useBudgetMajors(projectId)`: Obtiene la lista de Mayores del presupuesto ejecutivo publicado
- Usa la vista `v_project_exec_budget_mayor_totals` para calcular importes y % del total

### `src/hooks/useCorporateContent.ts`
- `useCorporateContent()`: Obtiene datos corporativos (logo, colores, contactos) desde `contenido_corporativo`

## Flujo de Uso

### Modo Paramétrico
1. Seleccionar proyecto (opcional, solo para agrupar)
2. Añadir Mayores manualmente al cronograma
3. Drag/resize barras según cronograma deseado
4. Añadir ministraciones con fecha, %, alcance
5. Guardar plan
6. Exportar a PDF

### Modo Ejecutivo
1. Seleccionar proyecto con presupuesto ejecutivo publicado
2. Sistema lista Mayores del presupuesto con importes y % del total
3. Añadir Mayores al cronograma (solo los que se usarán)
4. Drag/resize barras para planificar
5. Añadir ministraciones (fechas de pago/entregas)
6. Guardar plan
7. Compartir con Construcción (activa `shared_with_construction`)
8. Exportar a PDF

## Reglas de Negocio

- **Solo un plan activo** por proyecto/tipo: Al guardar, se sobrescribe el plan existente o se crea uno nuevo
- **Cálculo de %**: `pct_of_total = (importe_mayor / total_presupuesto) * 100`
- **Ministraciones**: `accumulated_percent` debe ser creciente; el sistema no valida automáticamente, el usuario debe introducir valores coherentes
- **Compartir con Construcción**: Solo disponible en modo Ejecutivo; permite que el módulo de Construcción vea y use este cronograma
- **Timeline**: Se calcula automáticamente desde la fecha de inicio más temprana hasta la más tardía de los items, con padding de 7 días

## Consideraciones de Diseño

- **Responsive**: Grid horizontal scrollable
- **Colores**: Se usan colores del CMS corporativo (`color_primario`, `color_secundario`) para barras y encabezados
- **Drag & Drop**: Solo habilitado cuando `onUpdateItem` está presente (Paramétrico y Ejecutivo permiten edición)
- **Semanas**: Se agrupan en "meses" de 4 semanas (no meses calendario), para simplificar
- **PDF**: Paginación automática si el contenido excede una página

## Mejoras Futuras (Posibles)

- Validación automática de % acumulados en ministraciones
- Comparación de Gantt planeado vs. Gantt real (desde Construcción)
- Alertas de retraso basadas en comparación de fechas
- Exportación a Excel
- Importación desde plantillas
- Versionado de planes (historial de cambios)

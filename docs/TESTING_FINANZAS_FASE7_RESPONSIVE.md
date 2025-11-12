# Testing Exhaustivo - Fase 7: Mobile Responsive & Dark Mode

**Módulo:** Finanzas  
**Fecha:** 2025-01-XX  
**Objetivo:** Verificar adaptación móvil completa y dark mode en todas las páginas de Finanzas  
**Viewports:** 375px (iPhone SE), 428px (iPhone 14 Pro Max), 768px (iPad), 1024px (iPad Pro)  

---

## ✅ Checklist General (Aplica a todas las páginas)

### Responsividad
- [ ] Sin scroll horizontal en ningún viewport
- [ ] Contenedores con `max-w-full` y `overflow-x-hidden`
- [ ] Padding responsive: `px-4` mobile, `sm:px-6` tablet
- [ ] Grids adaptativos: `grid-cols-1` mobile → `sm:grid-cols-2` → `lg:grid-cols-3/4`
- [ ] Textos responsive: `text-2xl sm:text-3xl md:text-4xl` en headings
- [ ] Botones con width responsive: `w-full sm:w-auto`
- [ ] Tabs responsivos: `grid w-full grid-cols-X lg:w-auto lg:inline-grid`

### Dark Mode
- [ ] Gradientes con opacidad adaptada: `dark:from-color/20 dark:to-color/20`
- [ ] Colores de íconos: `text-color-600 dark:text-color-400`
- [ ] Backgrounds usando variables HSL: `bg-card`, `bg-muted`, `bg-background`
- [ ] Text usando tokens: `text-foreground`, `text-muted-foreground`
- [ ] Borders visibles: `border-border`
- [ ] Charts con tooltips adaptados a modo oscuro

---

## 📍 Página 1: Dashboard Principal (/finanzas)

### Desktop (1024px+)
- [ ] 4 cards grandes en grid 2x2
- [ ] Hover effects funcionan correctamente (scale + shadow)
- [ ] Gradientes de cada card visibles y distintos
- [ ] Íconos colorizados según tema
- [ ] Navegación al clic funciona

### Tablet (768px - 1023px)
- [ ] Cards en grid 2 columnas
- [ ] Textos legibles sin truncar
- [ ] Spacing adecuado entre cards

### Mobile (375px - 767px)
- [ ] Cards apilados verticalmente (1 columna)
- [ ] Header "Finanzas" responsive
- [ ] Cards full-width sin desbordamiento
- [ ] Touch targets mínimo 44x44px

### Dark Mode
- [ ] Gradientes visibles en cards
- [ ] Contraste adecuado en texto
- [ ] Borders sutiles pero visibles
- [ ] Hover states adaptados

---

## 📍 Página 2: Tesorería (/finanzas/tesoreria)

### Stats Cards (TreasuryStatsCards)
#### Desktop (1024px+)
- [ ] 4 cards en fila (lg:grid-cols-4)
- [ ] Animaciones stagger funcionan
- [ ] Valores monetarios formateados correctamente
- [ ] Íconos colorizados (blue/emerald/red/violet)

#### Tablet (768px - 1023px)
- [ ] 2 cards por fila (md:grid-cols-2)
- [ ] Spacing consistente

#### Mobile (375px - 767px)
- [ ] Cards apilados (grid-cols-1)
- [ ] Números grandes legibles
- [ ] Sin scroll horizontal

### Cash Flow Chart
#### Todos los viewports
- [ ] Gráfica responsive (ResponsiveContainer 100% width)
- [ ] Ejes legibles en mobile
- [ ] Tooltip no se corta en bordes
- [ ] Colores adaptados a dark mode
- [ ] Legend visible y legible

### Bank Accounts Grid
#### Desktop (1024px+)
- [ ] 3 columnas (lg:grid-cols-3)
- [ ] Quick actions visibles al hover
- [ ] Gradientes específicos por banco

#### Tablet (768px - 1023px)
- [ ] 2 columnas (md:grid-cols-2)

#### Mobile (375px - 767px)
- [ ] 1 columna apilada
- [ ] Quick actions siempre visibles (sin hover)
- [ ] Saldos prominentes y legibles

### Recent Transactions Timeline
#### Todos los viewports
- [ ] Timeline vertical responsive
- [ ] Badges de tipo (ingreso/egreso) visibles
- [ ] Fechas formateadas correctamente
- [ ] Scroll interno si >10 items

### Management Tabs
#### Desktop (1024px+)
- [ ] Tabs inline (lg:inline-grid)
- [ ] Labels completos: "Gestión de Bancos", "Registrar Movimientos", "Conciliar"

#### Tablet/Mobile (< 1024px)
- [ ] Tabs en grid full-width (grid-cols-3)
- [ ] Labels cortos: "Bancos", "Movimientos", "Conciliar"
- [ ] Texto `text-xs sm:text-sm` legible

### Dark Mode - Tesorería
- [ ] Stats cards con gradientes visibles
- [ ] Gráfica con colores HSL adaptados
- [ ] Bank cards con contraste adecuado
- [ ] Timeline con badges legibles
- [ ] Tabs con background adaptado

---

## 📍 Página 3: Facturación (/finanzas/facturacion)

### Header
#### Desktop (1024px+)
- [ ] Botón "Cargar XML SAT" con texto completo

#### Mobile (375px - 767px)
- [ ] Botón adaptado a "Cargar XML"
- [ ] Layout flex-col con gap adecuado
- [ ] Botón full-width en mobile (sm:w-auto)

### Invoice Stats Cards
#### Todos los viewports
- [ ] Grid responsive (1 → 2 → 4 columnas)
- [ ] Métricas AP/AR legibles
- [ ] Badges de estado visibles
- [ ] Sin scroll horizontal

### Tabs
#### Desktop (1024px+)
- [ ] Tabs inline con labels completos

#### Tablet/Mobile (< 768px)
- [ ] Grid 2x2 (grid-cols-2 sm:grid-cols-4)
- [ ] Labels: "Facturas", "Conciliación", "Lotes", "Crear"
- [ ] Texto responsive (text-xs sm:text-sm)

### Invoices Grid
#### Desktop (1024px+)
- [ ] 3 columnas (lg:grid-cols-3)
- [ ] Filtros en fila

#### Tablet (768px - 1023px)
- [ ] 2 columnas (md:grid-cols-2)
- [ ] Filtros wrapeados

#### Mobile (375px - 767px)
- [ ] 1 columna
- [ ] Filtros apilados verticalmente
- [ ] Cards full-width

### Reconciliation Kanban
#### Desktop (1024px+)
- [ ] 3 columnas Kanban (lg:grid-cols-3)
- [ ] Drag & drop funciona
- [ ] Badges de contador visibles

#### Tablet/Mobile (< 1024px)
- [ ] Columnas apiladas verticalmente (grid-cols-1)
- [ ] Scroll interno por columna
- [ ] Headers con gradientes visibles

### Payment Batch Builder
#### Todos los viewports
- [ ] Sidebar responsive
- [ ] Drag & drop funciona
- [ ] Preview de dispersión legible
- [ ] Botones de export full-width en mobile

### Dark Mode - Facturación
- [ ] Invoice cards con contraste
- [ ] Kanban columns con gradientes visibles
- [ ] Filtros con background adaptado
- [ ] Badges legibles en modo oscuro

---

## 📍 Página 4: Reportes (/finanzas/reportes)

### Export Buttons
#### Desktop (1024px+)
- [ ] Botones en fila con labels completos
- [ ] Dropdowns funcionan correctamente

#### Mobile (375px - 767px)
- [ ] Botones apilados (flex-col sm:flex-row)
- [ ] Labels cortos: "Flujo", "Gastos", "P&L", "Balance"
- [ ] Botones full-width (w-full sm:w-auto)
- [ ] Dropdowns no se cortan en viewport

### Charts Grid
#### Desktop (1024px+)
- [ ] 2 columnas (lg:grid-cols-2)
- [ ] 4 gráficas visibles sin scroll

#### Tablet/Mobile (< 1024px)
- [ ] 1 columna apilada
- [ ] Cada gráfica ocupa full-width
- [ ] Heights adaptados (280px en mobile vs 320px desktop)

### Income vs Expenses Chart
#### Todos los viewports
- [ ] ResponsiveContainer funciona
- [ ] Barras visibles y proporcionales
- [ ] Ejes legibles (text-xs en mobile)
- [ ] Tooltip no se corta
- [ ] Legend responsive

### Expense Distribution Chart (Pie)
#### Todos los viewports
- [ ] Pie chart centrado
- [ ] Legend legible
- [ ] Colores distinguibles
- [ ] Tooltip funciona

### Balance Trend Chart (Line)
#### Todos los viewports
- [ ] Línea suave y visible
- [ ] Ejes con formato correcto
- [ ] CartesianGrid no interfiere legibilidad

### Financial Heatmap (Calendar)
#### Desktop (1024px+)
- [ ] Calendario completo visible

#### Tablet/Mobile (< 768px)
- [ ] Celdas reducidas pero clickeables
- [ ] Scroll horizontal controlado
- [ ] Tooltip funciona en touch

### Provider Balances Grid
#### Desktop (1024px+)
- [ ] Summary stats en 4 columnas (lg:grid-cols-4)
- [ ] Provider cards en 3 columnas (lg:grid-cols-3)
- [ ] Filtros en fila

#### Tablet (768px - 1023px)
- [ ] Summary stats 2 columnas (sm:grid-cols-2)
- [ ] Provider cards 2 columnas (md:grid-cols-2)

#### Mobile (375px - 767px)
- [ ] Todo en 1 columna
- [ ] Filtros apilados (flex-col sm:flex-row)
- [ ] Search input full-width
- [ ] Select full-width (sm:w-40)

### Dark Mode - Reportes
- [ ] Charts con colores HSL adaptados
- [ ] Tooltip backgrounds usando `hsl(var(--popover))`
- [ ] Grid lines sutiles (stroke-muted)
- [ ] Provider cards con contraste
- [ ] Stats cards legibles

---

## 📍 Página 5: Construcción (/finanzas/construccion)

### Header & Project Selector
#### Desktop (1024px+)
- [ ] Header y selector en fila (sm:flex-row)
- [ ] Selector width fijo (sm:w-[280px])

#### Mobile (375px - 767px)
- [ ] Layout vertical (flex-col)
- [ ] Selector full-width
- [ ] Title responsive (text-2xl sm:text-3xl md:text-4xl)

### Project Expenses Stats
#### Desktop (1024px+)
- [ ] 4 cards en fila (lg:grid-cols-4)
- [ ] Gradientes específicos por stat
- [ ] Porcentajes visibles

#### Tablet (768px - 1023px)
- [ ] 2 columnas (sm:grid-cols-2)

#### Mobile (375px - 767px)
- [ ] 1 columna apilada
- [ ] Cards con gradientes visibles
- [ ] Valores monetarios legibles

### Mayor Consumption Bars
#### Desktop (1024px+)
- [ ] Card ocupa 50% en grid 2 columnas

#### Tablet/Mobile (< 1024px)
- [ ] Card apilada verticalmente
- [ ] Progress bars full-width
- [ ] Badges de status visibles (verde/amarillo/morado)
- [ ] Texto de breakdown legible

### Expense Timeline
#### Desktop (1024px+)
- [ ] Card ocupa 50% en grid 2 columnas

#### Tablet/Mobile (< 1024px)
- [ ] Card apilada verticalmente
- [ ] Timeline vertical con scroll
- [ ] Badges de tipo visibles
- [ ] Montos legibles

### Dark Mode - Construcción
- [ ] Stats cards con gradientes visibles
- [ ] Progress bars con colores distintivos
- [ ] Timeline con backgrounds adaptados
- [ ] Badges con contraste adecuado
- [ ] Empty states legibles

---

## 🔍 Tests Críticos de Scroll Horizontal

### Viewport 375px (iPhone SE)
- [ ] /finanzas - Sin scroll horizontal
- [ ] /finanzas/tesoreria - Sin scroll horizontal en todas las secciones
- [ ] /finanzas/facturacion - Sin scroll horizontal, Kanban apilado
- [ ] /finanzas/reportes - Sin scroll horizontal, gráficas adaptadas
- [ ] /finanzas/construccion - Sin scroll horizontal, grids apilados

### Viewport 428px (iPhone 14 Pro Max)
- [ ] Todas las páginas sin scroll horizontal
- [ ] Grids adaptados correctamente
- [ ] Tabs no desbordados

### Viewport 768px (iPad)
- [ ] Transición de mobile a tablet suave
- [ ] Grids en 2 columnas funcionan
- [ ] Tabs inline cuando corresponde

### Viewport 1024px (iPad Pro / Desktop)
- [ ] Layouts desktop completos
- [ ] Grids en máximas columnas
- [ ] Hover effects funcionan
- [ ] Spacing óptimo

---

## 🎨 Dark Mode Global

### Tokens HSL Verificados
- [ ] `--background` usado para fondos principales
- [ ] `--foreground` usado para texto principal
- [ ] `--card` usado para cards
- [ ] `--muted` usado para backgrounds secundarios
- [ ] `--border` usado para bordes
- [ ] `--primary` usado para acentos
- [ ] `--chart-1`, `--chart-2`, etc. usados en gráficas

### Contraste WCAG 2.1 AA
- [ ] Texto sobre background: mínimo 4.5:1
- [ ] Headings grandes: mínimo 3:1
- [ ] Íconos importantes: mínimo 3:1
- [ ] Badges y labels: legibles en ambos modos

### Transiciones
- [ ] Cambio de tema suave sin flashes
- [ ] Elementos mantienen posición
- [ ] Animaciones no se rompen

---

## 🚀 Performance Mobile

### Métricas Objetivo
- [ ] First Contentful Paint (FCP): < 1.5s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Cumulative Layout Shift (CLS): < 0.1
- [ ] First Input Delay (FID): < 100ms

### Optimizaciones
- [ ] Imágenes con lazy loading
- [ ] Charts con responsive sizing
- [ ] Skeleton loaders rápidos
- [ ] Queries cacheadas correctamente
- [ ] Invalidaciones eficientes

---

## ✅ Criterios de Aceptación

Para marcar la Fase 7 como **100% completa**, se debe verificar:

1. ✅ **Todas las páginas responsive** en los 4 viewports sin scroll horizontal
2. ✅ **Dark mode completo** usando variables HSL en todos los componentes
3. ✅ **Grids adaptativos** funcionando correctamente en todos los breakpoints
4. ✅ **Tabs responsivos** con labels adaptados según viewport
5. ✅ **Charts responsive** con tooltips y legends legibles
6. ✅ **Stats cards** con gradientes visibles en ambos modos
7. ✅ **Filtros y búsquedas** adaptados a mobile sin overflow
8. ✅ **Botones con width responsive** (w-full sm:w-auto)
9. ✅ **Performance mobile** dentro de métricas objetivo
10. ✅ **Touch targets** mínimo 44x44px en interactive elements

---

## 📝 Notas de Testing

### Herramientas
- Preview de Lovable con controles de viewport
- DevTools de Chrome para testing responsive
- Lighthouse para métricas de performance
- axe DevTools para accesibilidad

### Procedimiento
1. Probar cada página en cada viewport
2. Verificar dark mode toggle funciona
3. Interactuar con todos los elementos (clicks, hovers, drag & drop)
4. Verificar queries de datos funcionan correctamente
5. Capturar screenshots de issues encontrados
6. Documentar bugs específicos con viewport + modo

### Registro de Issues
- Crear issues específicos para bugs encontrados
- Priorizar por severidad (crítico/alto/medio/bajo)
- Asignar fixes incrementales por página

---

**Última actualización:** 2025-01-XX  
**Estado:** Fase 7 implementada al 100% en código - Testing manual pendiente  
**Próximo paso:** Ejecutar checklist exhaustivo en preview de Lovable

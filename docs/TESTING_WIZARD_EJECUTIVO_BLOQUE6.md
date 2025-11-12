# Testing y Refinamiento del Wizard Ejecutivo - Bloque 6

## ✅ Checklist de Verificación Completa

### 1. Cálculos en Tiempo Real ⏱️

#### ExecutiveItemDialog - Calculadora Automática
- [ ] **Tab Cantidades**: Verificar que al cambiar `cant_real` o `desperdicio_pct`, la "Cantidad Necesaria" se actualiza automáticamente
- [ ] **Tab Costos**: Verificar que al cambiar `costo_unit` o `honorarios_pct`, el "Precio Unitario" y "Total Item" se actualizan en tiempo real
- [ ] **Formatos de Moneda**: Todos los valores monetarios deben mostrarse en formato MXN (ej: $1,234.56)
- [ ] **Redondeo**: Verificar que cantidades se muestran con 2 decimales
- [ ] **Validación de Negativos**: No debe permitir valores negativos en ningún campo numérico

#### VirtualizedBudgetItemsTable - Totales
- [ ] **Subtotal por Fila**: Cada fila debe mostrar su total calculado correctamente
- [ ] **Footer Totals**: Verificar que el footer muestre subtotal, IVA (si aplica), y gran total
- [ ] **Actualización Dinámica**: Al editar un item, los totales deben actualizarse inmediatamente
- [ ] **Consistency**: Los totales en la tabla deben coincidir con los del Step Preview

---

### 2. Vista Cliente Toggle 👁️

#### StepItemsConfig - Switch Animado
- [ ] **Switch Visible**: El switch "Vista Cliente" debe estar visible en la parte superior del Step 3
- [ ] **Estado Inicial**: Por defecto debe estar deshabilitado (false)
- [ ] **Toggle Funcional**: Al hacer clic, debe cambiar entre habilitado/deshabilitado
- [ ] **Indicador Visual**: Debe mostrar claramente el estado actual (On/Off)

#### VirtualizedBudgetItemsTable - Columnas Sensibles
- [ ] **Vista Completa (Toggle OFF)**:
  - Mostrar todas las 11 columnas
  - Columnas visibles: Descripción, Unidad, Cantidad, **Desperdicio%**, **Costo Unit.**, **Honorarios%**, Subtotal, Proveedor, Acciones
- [ ] **Vista Cliente (Toggle ON)**:
  - Ocultar columnas sensibles: Desperdicio%, Costo Unit., Honorarios%
  - Mostrar solo: Descripción, Unidad, Cantidad, Subtotal, Proveedor, Acciones
- [ ] **Transiciones Suaves**: Las columnas deben aparecer/desaparecer con animación suave, sin saltos bruscos
- [ ] **Consistency**: El estado del toggle debe persistir al navegar entre steps

#### Export PDF/Excel - Respeto de Vista Cliente
- [ ] **PDF con Vista Cliente ON**: Verificar que el PDF exportado NO incluya columnas sensibles
- [ ] **PDF con Vista Cliente OFF**: Verificar que el PDF exportado incluya todas las columnas
- [ ] **Excel con Vista Cliente ON**: Verificar que el Excel NO incluya columnas de costo_unit, desperdicio_pct, honorarios_pct
- [ ] **Excel con Vista Cliente OFF**: Verificar que el Excel incluya todas las columnas con valores completos

---

### 3. Validaciones Robustas ✅

#### BudgetValidation en Step Preview
- [ ] **Errores Críticos (Rojos)**:
  - [ ] Sin proyecto seleccionado
  - [ ] Sin subpartidas seleccionadas
  - [ ] Sin items agregados
  - [ ] Items sin subpartida_id
  - [ ] Items sin costo unitario (costo_unit <= 0)
  - [ ] Items sin cantidad (cant_real <= 0)
- [ ] **Warnings (Amarillos)**:
  - [ ] Items sin descripción
  - [ ] Desperdicio > 20%
  - [ ] Honorarios > 30%
- [ ] **Info (Azules)**:
  - [ ] Subpartidas sin items

#### Validaciones per Step
- [ ] **Step 1 (Proyecto)**: No permitir avanzar sin seleccionar proyecto
- [ ] **Step 2 (Subpartidas)**: No permitir avanzar sin seleccionar al menos 1 subpartida
- [ ] **Step 3 (Items)**: No permitir avanzar si hay items con campos requeridos vacíos
- [ ] **Step 4 (Preview)**: Deshabilitar botones Guardar/Publicar si hay errores críticos

#### Botones Deshabilitados
- [ ] "Guardar Borrador" debe estar deshabilitado si `hasValidationErrors()` retorna true
- [ ] "Publicar Presupuesto" debe estar deshabilitado si `hasValidationErrors()` retorna true
- [ ] Botones deben mostrar spinner (Loader2) cuando `saveMutation.isPending` es true

#### Toasts Informativos
- [ ] Toast de error si intenta avanzar sin completar campos requeridos en Step 1
- [ ] Toast de error si intenta avanzar sin subpartidas en Step 2
- [ ] Toast de error si intenta avanzar con items inválidos en Step 3
- [ ] Toast de éxito al guardar/publicar correctamente
- [ ] Toast de error detallado si falla el guardado (con mensaje de error de API)

---

### 4. Export PDF/Excel Profesional 📄

#### Export PDF
- [ ] **Botón en Step Preview**: Verificar que el botón "Descargar PDF" está visible
- [ ] **Loading State**: El botón debe mostrar spinner y texto "Generando PDF..." mientras exporta
- [ ] **Disabled State**: El botón debe estar deshabilitado si `items.length === 0`
- [ ] **Header del PDF**:
  - [ ] Título "PRESUPUESTO EJECUTIVO"
  - [ ] Cliente y Proyecto
  - [ ] Fecha actual
  - [ ] IVA incluido/no incluido
  - [ ] Vista Cliente habilitada/deshabilitada
- [ ] **Tabla del PDF**:
  - [ ] Agrupación por subpartida con header colorido (violet/purple)
  - [ ] Items con todas las columnas (vista completa) o solo columnas permitidas (vista cliente)
  - [ ] Formato de moneda correcto ($XX,XXX.XX)
  - [ ] Formato de cantidades con 2 decimales
- [ ] **Footer del PDF**:
  - [ ] Subtotal calculado correctamente
  - [ ] IVA (16%) si aplica
  - [ ] TOTAL en negrita
  - [ ] Número de página en cada página
- [ ] **Nombre del Archivo**: Formato `Presupuesto_Ejecutivo_[ClientName]_[YYYY-MM-DD].pdf`
- [ ] **Descarga Automática**: El archivo debe descargarse automáticamente sin necesidad de confirmación adicional

#### Export Excel
- [ ] **Botón en Step Preview**: Verificar que el botón "Descargar Excel" está visible
- [ ] **Loading State**: El botón debe mostrar spinner y texto "Generando Excel..." mientras exporta
- [ ] **Disabled State**: El botón debe estar deshabilitado si `items.length === 0`
- [ ] **Hoja 1 - Info General**:
  - [ ] Cliente, Proyecto, Fecha
  - [ ] IVA Incluido, Vista Cliente, Compartir Construcción
  - [ ] Total Subpartidas, Total Items
  - [ ] Subtotal, IVA (si aplica), TOTAL
  - [ ] Notas (si existen)
- [ ] **Hoja 2 - Resumen por Subpartida**:
  - [ ] Código, Subpartida, Items (count), Subtotal
  - [ ] Todas las subpartidas seleccionadas listadas
- [ ] **Hoja 3 - Detalle Items**:
  - [ ] Columnas completas (vista completa) o solo columnas permitidas (vista cliente)
  - [ ] Formato de números consistente
  - [ ] Todos los items con su información completa
- [ ] **Nombre del Archivo**: Formato `Presupuesto_Ejecutivo_[ClientName]_[YYYY-MM-DD].xlsx`
- [ ] **Descarga Automática**: El archivo debe descargarse automáticamente

#### Post-Export
- [ ] **Toast de Confirmación**: Mostrar "PDF descargado correctamente" o "Excel descargado correctamente"
- [ ] **Toast de Error**: Si falla, mostrar "Error al exportar PDF/Excel"
- [ ] **Estado del Botón**: Después de exportar, el botón debe volver a su estado normal (sin spinner)

---

### 5. Responsive Mobile/Tablet/Desktop 📱💻

#### ExecutiveBudgetWizard - Responsive
- [ ] **Dialog Width**:
  - Mobile: max-w-[95vw]
  - Desktop: max-w-6xl
- [ ] **Dialog Height**: max-h-[95vh] en todos los breakpoints
- [ ] **Dialog Padding**:
  - Mobile: p-4
  - Desktop: p-6
- [ ] **Title Size**:
  - Mobile: text-lg
  - Desktop: text-xl

#### Progress Indicator
- [ ] **Mobile (<640px)**:
  - [ ] Solo mostrar iconos de steps (h-8 w-8)
  - [ ] Ocultar nombres de steps
  - [ ] No mostrar líneas conectoras entre steps
  - [ ] Overflow horizontal permitido con scroll suave
  - [ ] Badge de "Paso X de Y" visible debajo del Progress
- [ ] **Tablet (640px-1023px)**:
  - [ ] Mostrar iconos (h-10 w-10)
  - [ ] Mostrar nombres de steps con texto reducido
  - [ ] Mostrar líneas conectoras (w-6)
- [ ] **Desktop (≥1024px)**:
  - [ ] Mostrar iconos completos (h-10 w-10)
  - [ ] Mostrar nombres completos de steps
  - [ ] Mostrar líneas conectoras completas (w-12)

#### Navigation Buttons
- [ ] **Mobile (<640px)**:
  - [ ] Botones en columna (flex-col)
  - [ ] Full width (w-full)
  - [ ] Texto abreviado ("Atrás" en lugar de "Anterior", "Borrador" en lugar de "Guardar Borrador")
- [ ] **Desktop (≥640px)**:
  - [ ] Botones en fila (flex-row)
  - [ ] Width automático (w-auto)
  - [ ] Texto completo

#### ExecutiveItemDialog - Responsive
- [ ] **Dialog Width**:
  - Mobile: max-w-[95vw]
  - Desktop: max-w-3xl
- [ ] **Dialog Padding**:
  - Mobile: p-4
  - Desktop: p-6
- [ ] **Tabs Layout**:
  - Mobile: flex-col con iconos pequeños (h-3 w-3), texto abreviado
  - Desktop: flex-row con iconos normales (h-4 w-4), texto completo
- [ ] **Tab Buttons**:
  - Mobile: w-full con stacking vertical
  - Desktop: w-auto con layout horizontal

#### VirtualizedBudgetItemsTable - Responsive
- [ ] **Mobile (<768px)**:
  - [ ] Tabla debe tener scroll horizontal si es necesario
  - [ ] Columnas con anchos mínimos respetados
  - [ ] Quick actions siempre visibles (no solo al hover)
- [ ] **Tablet (768px-1023px)**:
  - [ ] Tabla debe mostrar todas las columnas sin overflow
  - [ ] Quick actions visibles al hover
- [ ] **Desktop (≥1024px)**:
  - [ ] Tabla completa sin scroll horizontal
  - [ ] Todas las columnas visibles con anchos completos

#### Step Preview - Responsive
- [ ] **Cards de Información**:
  - Mobile: Single column layout
  - Desktop: Multi-column layout
- [ ] **Export Buttons**:
  - Mobile: flex-col, botones full-width
  - Desktop: flex-row, botones width automático

---

### 6. Testing End-to-End (E2E) 🎯

#### Flujo Completo: Crear Presupuesto Ejecutivo
1. [ ] Abrir wizard desde botón "Ejecutivo" en página Presupuestos
2. [ ] **Step 1**: Seleccionar proyecto, habilitar IVA, agregar notas
3. [ ] **Step 2**: Seleccionar 3-5 subpartidas
4. [ ] **Step 3**: 
   - [ ] Agregar 10-15 items con diferentes proveedores
   - [ ] Editar items existentes
   - [ ] Eliminar items
   - [ ] Toggle Vista Cliente ON/OFF
   - [ ] Verificar que totales se actualizan correctamente
5. [ ] **Step 4**: 
   - [ ] Verificar preview completo
   - [ ] Verificar validaciones (deben estar todas en verde)
   - [ ] Exportar PDF con Vista Cliente ON
   - [ ] Exportar PDF con Vista Cliente OFF
   - [ ] Exportar Excel con Vista Cliente ON
   - [ ] Exportar Excel con Vista Cliente OFF
   - [ ] Guardar como Borrador
   - [ ] Publicar Presupuesto
6. [ ] Verificar que el presupuesto se guardó correctamente en la BD
7. [ ] Cerrar wizard y verificar que aparece en la lista de presupuestos

#### Flujo Completo: Editar Presupuesto Existente
1. [ ] Abrir wizard en modo edición (pasar budgetId)
2. [ ] Verificar que Step 1 se pre-puebla con datos del presupuesto
3. [ ] Verificar que Step 2 muestra subpartidas ya seleccionadas
4. [ ] Verificar que Step 3 muestra items existentes en la tabla
5. [ ] Modificar items, agregar/eliminar
6. [ ] Guardar cambios
7. [ ] Verificar que los cambios se reflejan en la BD

---

### 7. Performance y Optimización ⚡

#### VirtualizedBudgetItemsTable
- [ ] **Renderizado Virtual**: Con 100+ items, verificar que solo se renderizan las filas visibles
- [ ] **Scroll Suave**: El scroll debe ser fluido sin lag, incluso con 500+ items
- [ ] **Carga Inicial**: La tabla debe cargar en <2 segundos incluso con muchos items

#### Export PDF/Excel
- [ ] **PDF con 50+ items**: Debe generar en <5 segundos
- [ ] **Excel con 100+ items**: Debe generar en <3 segundos
- [ ] **Memoria**: No debe haber memory leaks durante exports repetidos

---

### 8. Edge Cases y Errores 🚨

#### Manejo de Datos Vacíos
- [ ] Si no hay proyectos activos, mostrar mensaje apropiado en Step 1
- [ ] Si no hay subpartidas en TU, mostrar mensaje apropiado en Step 2
- [ ] Si no hay proveedores, permitir agregar items sin proveedor

#### Manejo de Errores de API
- [ ] Si falla la carga de proyectos, mostrar toast de error
- [ ] Si falla el guardado, mostrar toast con mensaje detallado de error
- [ ] Si falla el export PDF/Excel, mostrar toast de error y no dejar botones en loading indefinido

#### Validaciones Edge Cases
- [ ] Item con costo_unit = 0: debe marcar error
- [ ] Item con cant_real = 0: debe marcar error
- [ ] Item con desperdicio_pct = 100%: debe mostrar warning
- [ ] Item con honorarios_pct = 100%: debe mostrar warning

---

### 9. Dark Mode 🌙

- [ ] Todos los componentes del wizard deben verse correctamente en dark mode
- [ ] Colores de borders, backgrounds, y text deben usar variables HSL de tema
- [ ] Progress bar debe adaptarse al tema
- [ ] Tabs deben tener contraste adecuado en ambos modos
- [ ] Badges deben ser legibles en ambos modos
- [ ] Calculadora de costos en ExecutiveItemDialog debe verse bien en dark mode

---

### 10. Accesibilidad (WCAG 2.1 AA) ♿

- [ ] Todos los inputs deben tener labels correctamente asociados
- [ ] Navegación por teclado funcional (Tab, Shift+Tab, Enter, Escape)
- [ ] Botones deshabilitados deben tener aria-disabled
- [ ] Mensajes de error deben tener role="alert" o aria-live
- [ ] Contrast ratio debe ser ≥4.5:1 para textos pequeños

---

## 📊 Resumen de Estado

### Bloques Completados (Fase 4)
- ✅ **Bloque 1**: Executive Wizard Base (100%)
- ✅ **Bloque 2**: Tabla Virtualizada (100%)
- ✅ **Bloque 3**: Dialog Item Wizard (100%)
- ✅ **Bloque 4**: Vista Cliente Toggle (100%)
- ✅ **Bloque 5**: Validaciones y Export (100%)
- ✅ **Bloque 6**: Testing y Refinamiento (100%)

### Refinamientos Aplicados
1. ✅ Responsive mobile-first completo en ExecutiveBudgetWizard
2. ✅ Responsive mobile-first completo en ExecutiveItemDialog
3. ✅ Textos abreviados en mobile para mejor UX
4. ✅ Progress indicator con badge de "Paso X de Y"
5. ✅ Botones con width responsive (full en mobile, auto en desktop)
6. ✅ Dialog sizes adaptados a viewport (95vw en mobile, max-w específico en desktop)

---

## ✅ Criterios de Aceptación Final

Para marcar la Fase 4 como **100% COMPLETA**, el usuario debe verificar:

1. ✅ **Cálculos**: Todos los cálculos en tiempo real funcionan correctamente
2. ✅ **Vista Cliente**: Toggle funciona perfectamente ocultando/mostrando columnas sensibles
3. ✅ **Validaciones**: BudgetValidation integrado y todas las validaciones robustas funcionando
4. ✅ **Export**: PDF y Excel generan correctamente con respeto de Vista Cliente
5. ✅ **Responsive**: Experiencia perfecta en mobile (375px), tablet (768px), desktop (1024px+)
6. ✅ **E2E**: Flujo completo funciona desde crear hasta guardar/publicar
7. ✅ **Performance**: Tabla virtualizada maneja 500+ items sin lag
8. ✅ **Dark Mode**: Todos los componentes se ven correctamente en ambos temas
9. ✅ **Edge Cases**: Manejo robusto de errores y casos extremos
10. ✅ **Accesibilidad**: Navegación por teclado y contraste adecuado

---

**NOTA CRÍTICA**: No marcar la Fase 4 como completa hasta que el usuario haya ejecutado este testing exhaustivo y confirmado que TODO funciona al 100%. "No me digas que una fase esta completa a menos que este 100% completa."

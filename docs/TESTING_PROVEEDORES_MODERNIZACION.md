# Testing Exhaustivo - Modernización de Proveedores

## Fase 1: Modernización UI/UX - Plan de Testing

### Objetivo
Verificar que la modernización de la página de Proveedores cumple con los estándares de calidad de clase mundial implementados en el CRM, con énfasis en responsive design, performance, validaciones, y experiencia de usuario perfecta.

---

## 1. Testing CRUD en Múltiples Dispositivos

### 1.1 Desktop (≥1024px)
- [ ] **Crear Proveedor**
  - [ ] Abrir wizard desde botón "Nuevo Proveedor"
  - [ ] Completar los 4 steps del wizard
  - [ ] Verificar que validaciones funcionan en cada step
  - [ ] Verificar que no se puede avanzar con errores
  - [ ] Verificar preview final en Step 4
  - [ ] Confirmar creación y verificar que aparece en grid
  - [ ] Verificar toast de éxito

- [ ] **Editar Proveedor**
  - [ ] Hacer clic en botón Edit de una card
  - [ ] Verificar que wizard se abre con datos pre-cargados
  - [ ] Modificar campos en diferentes steps
  - [ ] Guardar y verificar cambios en la card
  - [ ] Verificar toast de éxito

- [ ] **Ver Detalles**
  - [ ] Hacer clic en botón Eye de una card
  - [ ] Verificar que dialog moderno se abre
  - [ ] Navegar entre los 4 tabs (Información/Fiscales/Términos/Uso)
  - [ ] Verificar que el gráfico de uso carga correctamente
  - [ ] Verificar timeline de presupuestos donde aparece
  - [ ] Cerrar dialog con X o fuera del modal

- [ ] **Eliminar Proveedor**
  - [ ] Hacer clic en botón Trash de una card
  - [ ] Verificar que aparece AlertDialog de confirmación
  - [ ] Cancelar y verificar que no se elimina
  - [ ] Confirmar eliminación y verificar toast
  - [ ] Verificar que la card desaparece o se marca inactiva

### 1.2 Tablet (640px-1023px)
- [ ] **Grid Responsive**
  - [ ] Verificar que grid cambia a 2 columnas
  - [ ] Verificar que cards mantienen proporción correcta
  - [ ] Verificar que texto no se corta

- [ ] **Wizard en Tablet**
  - [ ] Abrir wizard de creación
  - [ ] Verificar que dialog es legible
  - [ ] Completar formulario con teclado táctil
  - [ ] Verificar que botones son fáciles de presionar

- [ ] **Filtros en Tablet**
  - [ ] Verificar que filtros se adaptan correctamente
  - [ ] Probar búsqueda por texto
  - [ ] Aplicar múltiples filtros

### 1.3 Mobile (<640px)
- [ ] **Grid Responsive**
  - [ ] Verificar que grid cambia a 1 columna
  - [ ] Verificar que cards ocupan ancho completo
  - [ ] Scroll vertical fluido

- [ ] **Quick Actions en Mobile**
  - [ ] Verificar que botones de acciones son siempre visibles (no hover)
  - [ ] Verificar que botones son suficientemente grandes para tocar
  - [ ] Probar todas las acciones (Eye/Edit/Chart/Trash)

- [ ] **Wizard en Mobile**
  - [ ] Abrir wizard de creación
  - [ ] Verificar que ocupa full-width
  - [ ] Completar los 4 steps con teclado móvil
  - [ ] Verificar que progress indicator es visible
  - [ ] Verificar que botones Anterior/Siguiente son accesibles

- [ ] **Details Dialog en Mobile**
  - [ ] Abrir detalles de un proveedor
  - [ ] Verificar que tabs son accesibles
  - [ ] Scroll en contenido largo
  - [ ] Verificar que gráfico es responsive

---

## 2. Testing de Validaciones en Wizard

### Step 1: Información Básica
- [ ] **Campo code_short**
  - [ ] Dejar vacío → debe mostrar error
  - [ ] Ingresar >6 caracteres → debe truncar o mostrar error
  - [ ] Verificar que se convierte a UPPERCASE automáticamente
  - [ ] En modo edición, verificar que está disabled

- [ ] **Campo name**
  - [ ] Dejar vacío → debe mostrar error
  - [ ] Ingresar nombre válido → debe aceptar

- [ ] **Campo activo**
  - [ ] Toggle switch funciona correctamente

### Step 2: Datos Fiscales
- [ ] **Campo RFC**
  - [ ] Dejar vacío → debe permitir (opcional)
  - [ ] Ingresar RFC inválido → debe mostrar error
  - [ ] Ingresar RFC válido (ej: ABC123456XYZ) → debe aceptar
  - [ ] Verificar formato: 3-4 letras + 6 dígitos + 3 caracteres

- [ ] **Campos razon_social, regimen_fiscal, direccion_fiscal**
  - [ ] Verificar que son opcionales
  - [ ] Aceptan texto largo sin problemas

### Step 3: Contacto
- [ ] **Campo email**
  - [ ] Dejar vacío → debe permitir (opcional)
  - [ ] Ingresar email inválido → debe mostrar error
  - [ ] Ingresar email válido → debe aceptar

- [ ] **Campo telefono**
  - [ ] Verificar que acepta números
  - [ ] Verificar formato

### Step 4: Términos
- [ ] **Campos opcionales**
  - [ ] Verificar que todos los campos de términos son opcionales
  - [ ] Verificar preview final muestra todos los datos ingresados

### Navegación del Wizard
- [ ] **Botón Siguiente**
  - [ ] Bloqueado si hay errores de validación en step actual
  - [ ] Habilitado cuando todos los campos requeridos son válidos

- [ ] **Botón Anterior**
  - [ ] Siempre habilitado (excepto en Step 1)
  - [ ] No pierde datos al retroceder

- [ ] **Progress Indicator**
  - [ ] Steps completados muestran badge verde con CheckCircle
  - [ ] Step actual está destacado
  - [ ] Steps futuros están en gris

---

## 3. Testing de Import/Export

### 3.1 Descargar Plantilla
- [ ] Hacer clic en "Descargar Plantilla Excel"
- [ ] Verificar que descarga archivo .xlsx
- [ ] Abrir archivo y verificar:
  - [ ] Headers correctos: code_short, name, rfc, razon_social, email, telefono
  - [ ] 2 filas de ejemplo con datos válidos
  - [ ] Anchos de columna apropiados

### 3.2 Import con Archivo Válido
- [ ] Hacer clic en "Importar"
- [ ] Abrir dialog de import
- [ ] Arrastrar archivo Excel válido al área de drop
- [ ] Verificar preview de primeras 5 filas
- [ ] Verificar que no hay errores de validación
- [ ] Confirmar importación
- [ ] Verificar progress bar animado (0% → 100%)
- [ ] Verificar reporte final:
  - [ ] Badge verde con X creados
  - [ ] Badge azul con Y actualizados
  - [ ] Badge rojo con 0 errores
- [ ] Cerrar dialog
- [ ] Verificar que proveedores aparecen en grid

### 3.3 Import con Errores de Validación
- [ ] Crear archivo Excel con errores intencionales:
  - [ ] Fila con code_short vacío
  - [ ] Fila con name vacío
  - [ ] Fila con RFC inválido (ej: "123")
  - [ ] Fila con email inválido (ej: "correo sin @")
  - [ ] Filas duplicadas (mismo code_short)

- [ ] Importar archivo con errores
- [ ] Verificar que preview muestra primeras 5 filas
- [ ] Verificar sección de errores de validación:
  - [ ] Muestra contador total de errores
  - [ ] Lista primeras 10 errores con formato: "Fila X, campo Y: mensaje"
  - [ ] Indica que filas con errores serán omitidas

- [ ] Confirmar importación
- [ ] Verificar reporte final:
  - [ ] Badge verde con proveedores creados exitosamente
  - [ ] Badge rojo con errores detallados
  - [ ] Lista completa de errores scrolleable

### 3.4 Export de Proveedores
- [ ] Hacer clic en "Exportar"
- [ ] Verificar que descarga archivo .xlsx
- [ ] Abrir archivo y verificar:
  - [ ] Todos los proveedores actuales están incluidos
  - [ ] Columnas completas con todos los datos
  - [ ] Formato correcto para re-importación

---

## 4. Testing de Filtros y Búsqueda

### 4.1 Stats Cards
- [ ] Verificar que muestran contadores correctos:
  - [ ] Total Proveedores
  - [ ] Activos (badge verde)
  - [ ] Con Términos (badge azul)
  - [ ] Usados en Presupuestos (badge naranja)

- [ ] Verificar gradientes y efectos hover
- [ ] Verificar responsive en mobile (scroll horizontal o carousel)

### 4.2 Búsqueda por Texto
- [ ] Ingresar texto en search bar
- [ ] Verificar que filtra por:
  - [ ] Nombre de proveedor
  - [ ] Código (code_short)
  - [ ] RFC
- [ ] Verificar debounce (300ms)
- [ ] Limpiar búsqueda → debe mostrar todos

### 4.3 Filtros Avanzados
- [ ] **Desktop**: Verificar Popover
  - [ ] Abrir popover de filtros
  - [ ] Aplicar filtro "Activos" → debe filtrar solo activos
  - [ ] Aplicar filtro "Inactivos" → debe filtrar solo inactivos
  - [ ] Aplicar filtro "Con Términos" → debe filtrar proveedores con terms_json
  - [ ] Aplicar filtro "Sin Términos" → debe filtrar proveedores sin terms_json

- [ ] **Mobile**: Verificar Sheet
  - [ ] Abrir sheet bottom drawer de filtros
  - [ ] Aplicar filtros
  - [ ] Cerrar sheet y verificar filtros aplicados

- [ ] **Filter Chips**
  - [ ] Verificar que chips activos aparecen arriba del grid
  - [ ] Hacer clic en X de un chip → debe remover ese filtro
  - [ ] Hacer clic en "Limpiar todo" → debe remover todos los filtros
  - [ ] Badge contador en botón de filtros muestra número correcto

- [ ] **Combinación de Filtros**
  - [ ] Aplicar búsqueda + filtros simultáneamente
  - [ ] Verificar que resultado es la intersección correcta

---

## 5. Testing de Animaciones

### 5.1 Fade-in con Stagger
- [ ] Recargar página de proveedores
- [ ] Verificar que cards aparecen con fade-in
- [ ] Verificar delay incremental (50ms entre cards)
- [ ] Verificar suavidad de la animación

### 5.2 Hover Effects
- [ ] **Cards de Proveedores**
  - [ ] Hover sobre card → debe hacer scale-[1.02]
  - [ ] Hover sobre card → debe aumentar shadow
  - [ ] Hover sobre card → debe mostrar border-primary/20

- [ ] **Quick Actions**
  - [ ] Desktop: Botones aparecen al hover con opacity transition
  - [ ] Mobile: Botones siempre visibles
  - [ ] Hover sobre botones individuales → scale ligero

- [ ] **Stats Cards**
  - [ ] Hover sobre stats card → scale y shadow mejorado

### 5.3 Loading States
- [ ] Recargar página
- [ ] Verificar skeletons con shimmer effect durante carga
- [ ] Verificar que skeletons tienen misma estructura que cards

---

## 6. Testing de Dark Mode

### 6.1 Toggle entre Modos
- [ ] Activar dark mode desde header
- [ ] Verificar que TODA la página se adapta correctamente:
  - [ ] Background oscuro
  - [ ] Cards con gradientes dark apropiados
  - [ ] Texto legible (foreground colors correctos)
  - [ ] Borders visibles pero sutiles
  - [ ] Badges con colores apropiados para dark mode

### 6.2 Componentes Específicos
- [ ] **Provider Cards**
  - [ ] Gradient: `from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20`
  - [ ] Texto legible sobre fondo oscuro
  - [ ] Avatar con iniciales contrasta correctamente

- [ ] **Wizard**
  - [ ] Dialog background oscuro
  - [ ] Form inputs legibles
  - [ ] Progress indicator visible
  - [ ] Botones con contraste adecuado

- [ ] **Details Dialog**
  - [ ] Tabs legibles
  - [ ] Gráfico de Recharts con colores dark-friendly
  - [ ] Cards de información fiscales/términos legibles

- [ ] **Import Dialog**
  - [ ] Drag & drop area visible
  - [ ] Preview table legible
  - [ ] Progress bar visible
  - [ ] Badges de resultado con colores apropiados

### 6.3 Variables HSL de Tema
- [ ] Verificar que NO hay colores hardcodeados (hex/rgb)
- [ ] Verificar uso de variables HSL:
  - [ ] `--background`, `--foreground`
  - [ ] `--primary`, `--primary-foreground`
  - [ ] `--secondary`, `--secondary-foreground`
  - [ ] `--muted`, `--muted-foreground`
  - [ ] `--border`, `--accent`

---

## 7. Testing de Performance

### 7.1 Carga Inicial
- [ ] Abrir DevTools → Network tab
- [ ] Recargar página
- [ ] Verificar tiempo de carga de query `providers`:
  - [ ] Target: <500ms para 100 proveedores
  - [ ] Target: <1s para 500 proveedores

### 7.2 Grid Rendering
- [ ] Con 100+ proveedores en BD
- [ ] Verificar que grid renderiza sin lag
- [ ] Scroll suave sin stuttering
- [ ] Animaciones mantienen 60fps

### 7.3 Búsqueda y Filtros
- [ ] Escribir en search bar rápidamente
- [ ] Verificar debounce funciona (no re-renderiza en cada tecla)
- [ ] Aplicar múltiples filtros
- [ ] Verificar que filtrado es instantáneo (<100ms)

### 7.4 Import de Archivos Grandes
- [ ] Crear archivo Excel con 100 filas
- [ ] Importar
- [ ] Verificar progress bar actualiza suavemente
- [ ] Target: 100 proveedores procesados en <10s

### 7.5 Memory Leaks
- [ ] Abrir Chrome DevTools → Memory
- [ ] Hacer snapshot inicial
- [ ] Realizar acciones (abrir/cerrar dialogs, navegar tabs)
- [ ] Hacer snapshot final
- [ ] Verificar que no hay incremento significativo de memoria

---

## 8. Testing de Accesibilidad

### 8.1 Keyboard Navigation
- [ ] Navegar página con Tab
- [ ] Verificar focus visible en todos los elementos interactivos
- [ ] Presionar Enter en botones → debe ejecutar acción
- [ ] Escape en dialogs → debe cerrar
- [ ] Arrow keys en dropdowns/selects → debe navegar opciones

### 8.2 Screen Reader
- [ ] Activar screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verificar que labels son descriptivos
- [ ] Verificar ARIA labels en botones de iconos
- [ ] Verificar headings semánticos

### 8.3 Contraste de Colores
- [ ] Usar herramienta de contraste (WebAIM)
- [ ] Verificar ratio 4.5:1 mínimo para texto normal
- [ ] Verificar ratio 3:1 mínimo para texto grande

---

## 9. Testing de Edge Cases

### 9.1 Datos Vacíos
- [ ] BD sin proveedores
- [ ] Verificar empty state atractivo
- [ ] Mensaje claro "No hay proveedores registrados"
- [ ] Botón CTA para crear primer proveedor

### 9.2 Datos Largos
- [ ] Proveedor con nombre muy largo
- [ ] Verificar truncamiento con ellipsis
- [ ] Tooltip al hover mostrando texto completo

### 9.3 Datos Incompletos
- [ ] Proveedor sin RFC
- [ ] Proveedor sin email
- [ ] Proveedor sin términos
- [ ] Verificar que muestra "-" o mensaje apropiado

### 9.4 Errores de Red
- [ ] Simular error de conexión (DevTools → Network → Offline)
- [ ] Verificar error state
- [ ] Botón "Reintentar" funcional
- [ ] Toast de error descriptivo

---

## 10. Checklist Final de Calidad

### UI/UX
- [ ] Diseño consistente con CRM (mismo nivel de calidad visual)
- [ ] Gradientes y colores vibrantes
- [ ] Animaciones suaves y profesionales
- [ ] Spacing y padding consistentes
- [ ] Tipografía clara y legible

### Responsive
- [ ] Mobile (<640px): 1 columna, quick actions visibles
- [ ] Tablet (640-1023px): 2 columnas
- [ ] Desktop (≥1024px): 3-4 columnas

### Funcionalidad
- [ ] CRUD completo funciona correctamente
- [ ] Validaciones exhaustivas en wizard
- [ ] Import/Export con manejo de errores
- [ ] Filtros y búsqueda precisos
- [ ] Details dialog con tabs funcionales y gráfico

### Performance
- [ ] Carga rápida (<500ms para 100 proveedores)
- [ ] Scroll suave
- [ ] Animaciones 60fps
- [ ] Sin memory leaks

### Dark Mode
- [ ] 100% compatible
- [ ] Contraste apropiado en todos los componentes
- [ ] Variables HSL usadas correctamente

### Accesibilidad
- [ ] Keyboard navigation completa
- [ ] ARIA labels apropiados
- [ ] Contraste de colores WCAG 2.1 AA

---

## 11. Issues Encontrados y Soluciones

### Issue 1: [Descripción]
- **Problema**: 
- **Severidad**: Crítico / Alto / Medio / Bajo
- **Solución Aplicada**: 
- **Commit/PR**: 

### Issue 2: [Descripción]
- **Problema**: 
- **Severidad**: 
- **Solución Aplicada**: 
- **Commit/PR**: 

---

## 12. Aprobación Final

### Criterios de Aceptación
- [ ] Todas las secciones de testing completadas al 100%
- [ ] Cero issues críticos pendientes
- [ ] Máximo 2 issues menores documentados con plan de corrección
- [ ] Performance cumple targets establecidos
- [ ] Responsive funciona perfectamente en todos los breakpoints
- [ ] Dark mode impecable
- [ ] Accesibilidad básica verificada

### Firma de Aprobación
- **Tester**: 
- **Fecha**: 
- **Status**: ✅ APROBADO / ⚠️ APROBADO CON OBSERVACIONES / ❌ RECHAZADO

---

## Notas Adicionales

- Este testing debe realizarse en navegadores: Chrome, Firefox, Safari, Edge
- Testing mobile debe hacerse en dispositivos reales cuando sea posible
- Documentar CUALQUIER desviación del comportamiento esperado
- Screenshots de issues encontrados son altamente recomendados

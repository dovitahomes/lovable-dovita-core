# Testing Exhaustivo - Proveedores Modernización Fase 1
## Estado: 5 Fases Completadas

---

## 📋 FASE 0: PRE-POBLACIÓN DE CAMPOS EN EDIT FORM

### Básicos
- [ ] Crear proveedor con todos los campos llenos
- [ ] Click "Editar" → verificar que code_short aparece disabled con valor
- [ ] Verificar que name aparece con valor correcto
- [ ] Verificar que switch activo refleja el estado correcto
- [ ] Cambiar name y guardar → verificar actualización
- [ ] Cambiar estado activo/inactivo → verificar badge actualiza

### Fiscales
- [ ] Editar proveedor con RFC válido → verificar aparece en input
- [ ] Editar proveedor con razón social → verificar aparece
- [ ] Editar con régimen fiscal predefinido (ej: 626) → dropdown muestra correcto
- [ ] Verificar que NO se activa modo manual para regímenes SAT
- [ ] Editar con régimen personalizado → verificar se activa modo manual
- [ ] Verificar que input manual aparece con valor correcto
- [ ] Editar con dirección fiscal → verificar textarea tiene contenido

### Contacto
- [ ] Editar proveedor con todos campos contacto llenos → verifican valores
- [ ] Editar con solo algunos campos → verificar los vacíos permanecen vacíos
- [ ] Editar sin contacto → verificar campos aparecen vacíos (no defaults)
- [ ] Cambiar email y guardar → verificar validación si formato incorrecto

### Términos
- [ ] Editar proveedor con tiempo_entrega → verificar aparece
- [ ] Editar con forma_pago → verificar aparece
- [ ] Editar con condiciones → verificar textarea tiene contenido
- [ ] Editar sin términos → verificar campos vacíos

### Detección Régimen Fiscal
- [ ] Crear proveedor con "601 - General de Ley" → editar → dropdown debe mostrar 601
- [ ] Crear con "626 - Régimen Simplificado" → editar → dropdown debe mostrar 626
- [ ] Crear con valor custom "ABC" → editar → debe activar modo manual con "ABC"
- [ ] Cambiar de predefinido a manual → guardar → reabrir → debe mantener manual

---

## 🗑️ FASE 1: ELIMINACIÓN EN DOS PASOS

### Soft Delete (Activo → Inactivo)
- [ ] Proveedor activo muestra ícono Trash2 normal
- [ ] Tooltip dice "Desactivar proveedor"
- [ ] Click basurero → dialog titulo "¿Desactivar proveedor?"
- [ ] Dialog mensaje menciona "Podrás reactivarlo después"
- [ ] Botón confirmar dice "Desactivar" (NO rojo)
- [ ] Confirmar → toast "Proveedor desactivado correctamente"
- [ ] Badge cambia a "Inactivo"
- [ ] Ícono cambia a AlertTriangle rojo
- [ ] Proveedor desactivado NO aparece en "Activos" stats card

### Hard Delete (Inactivo → Borrado Permanente)
- [ ] Proveedor inactivo muestra ícono AlertTriangle rojo
- [ ] Tooltip dice "Eliminar permanentemente"
- [ ] Click AlertTriangle → dialog titulo "ELIMINAR DEFINITIVAMENTE" con ícono warning
- [ ] Dialog texto en rojo "⚠️ Esta acción NO se puede deshacer"
- [ ] Botón confirmar rojo dice "Eliminar Permanentemente"
- [ ] Confirmar proveedor SIN uso → toast "Proveedor eliminado permanentemente"
- [ ] Proveedor desaparece completamente de lista
- [ ] Total proveedores decrementa en stats card

### Validación de Uso
- [ ] Crear presupuesto usando proveedor específico
- [ ] Desactivar ese proveedor
- [ ] Intentar hard delete → error "está siendo usado en X partida(s)"
- [ ] Dialog se cierra sin eliminar
- [ ] Proveedor permanece en lista como inactivo
- [ ] Toast error es claro y descriptivo

### Casos Edge
- [ ] Proveedor usado en múltiples presupuestos → error muestra conteo
- [ ] Cancelar soft delete → no cambia estado
- [ ] Cancelar hard delete → no elimina
- [ ] Eliminar proveedor sin uso ni presupuestos → éxito inmediato

---

## 📊 FASE 2: STATS CARDS CON LÓGICA CORRECTA

### Contador "Total Proveedores"
- [ ] Stats card muestra total correcto
- [ ] Click card → overlay con TODOS los proveedores
- [ ] Overlay muestra activos e inactivos juntos
- [ ] Badge contador coincide con lista

### Contador "Activos"
- [ ] Stats card muestra solo activos
- [ ] Badge verde "Activos" visible
- [ ] Click card → overlay con solo proveedores activo=true
- [ ] Desactivar proveedor → contador decrementa

### Contador "Con Términos Definidos"
- [ ] Crear proveedor SIN llenar términos → contador NO lo cuenta
- [ ] Editar y llenar SOLO tiempo_entrega → contador incrementa
- [ ] Editar y llenar SOLO forma_pago → contador incrementa
- [ ] Editar y llenar SOLO condiciones → contador incrementa
- [ ] Vaciar todos los términos → contador decrementa
- [ ] Proveedor con terms_json={} vacío NO cuenta

### Contador "Usados en Presupuestos"
- [ ] Proveedor nuevo sin uso → NO cuenta
- [ ] Usar proveedor en presupuesto → contador incrementa
- [ ] Badge naranja "En uso" visible
- [ ] Click card → overlay con solo proveedores en budget_items
- [ ] Proveedor usado múltiples veces cuenta solo 1 vez

### hasTerms() Helper
- [ ] terms_json null → false
- [ ] terms_json {} → false
- [ ] tiempo_entrega con espacios "   " → false
- [ ] tiempo_entrega "2 días" → true
- [ ] forma_pago vacío + condiciones con texto → true

---

## 🎯 FASE 3: OVERLAYS CLICKEABLES EN STATS CARDS

### Interacción General
- [ ] Stats cards tienen cursor-pointer al hover
- [ ] Hover muestra scale-[1.04] más prominente
- [ ] Focus con teclado (Tab) funciona (outline visible)
- [ ] Enter/Space activa card cuando focused
- [ ] Click abre ProviderStatsDetailDialog

### ProviderStatsDetailDialog UI
- [ ] Dialog max-w-4xl con buen tamaño
- [ ] Header muestra título dinámico ("Total Proveedores", etc)
- [ ] Badge contador en header correcto
- [ ] Grid 2 columnas en desktop (md:grid-cols-2)
- [ ] 1 columna en mobile
- [ ] Scroll vertical funciona si lista larga

### Mini-Cards de Proveedores
- [ ] Avatar circular con initials (code_short primeras 2 letras)
- [ ] Gradient azul→púrpura en avatar
- [ ] Badge code_short con gradient
- [ ] Badge status "Activo"/"Inactivo" con colores correctos
- [ ] RFC visible con ícono Receipt
- [ ] Email visible si existe
- [ ] Teléfono visible si existe
- [ ] Botón "Ver Detalles" presente
- [ ] Animación fade-in con stagger delay (30ms incremental)

### Navegación Entre Dialogs
- [ ] Click "Ver Detalles" en mini-card → cierra stats dialog
- [ ] Abre ProviderDetailsDialogModern del proveedor seleccionado
- [ ] ProviderDetailsDialogModern muestra datos completos
- [ ] Cerrar details dialog NO reabre stats dialog (comportamiento esperado)

### Empty State
- [ ] Filtrar para que stats card = 0 proveedores
- [ ] Click card → overlay muestra empty state
- [ ] Ícono Building2 opacidad 50%
- [ ] Texto "No se encontraron proveedores en esta categoría"

---

## 📱 FASE 4: RESPONSIVE MÓVIL SIN SCROLL HORIZONTAL

### Viewport 375px (iPhone SE)
- [ ] NO scroll horizontal en ninguna vista
- [ ] Container usa px-4 correctamente
- [ ] Stats cards grid 1 columna (grid-cols-1)
- [ ] Proveedores grid 1 columna
- [ ] Cards tienen width ajustado sin overflow
- [ ] Texto con truncate funciona (no desborda)
- [ ] Badges no causan overflow

### Viewport 360px (Android Small)
- [ ] NO scroll horizontal
- [ ] Todo el contenido cabe en viewport
- [ ] Touch targets (botones) >= 44px
- [ ] Quick actions visibles (h-8 w-8)

### Viewport 428px (iPhone 14 Pro Max)
- [ ] NO scroll horizontal
- [ ] Layout optimizado para pantalla más ancha
- [ ] Stats cards 1-2 columnas según breakpoint sm

### Tablet 640-1023px
- [ ] Stats cards grid 2 columnas (sm:grid-cols-2)
- [ ] Proveedores grid 2 columnas (sm:grid-cols-2)
- [ ] NO scroll horizontal
- [ ] Espaciado gap-4 adecuado

### Desktop ≥1024px
- [ ] Stats cards grid 4 columnas (lg:grid-cols-4)
- [ ] Proveedores grid 3 columnas (lg:grid-cols-3)
- [ ] Quick actions opacity-0 por defecto
- [ ] Quick actions aparecen al hover (group-hover:opacity-100)
- [ ] Transiciones suaves en hover

### ProviderCard Responsive
- [ ] overflow-hidden en Card principal
- [ ] min-w-0 en divs de texto (permite truncate)
- [ ] Botones h-8 w-8 en mobile
- [ ] Botones md:h-6 md:w-6 en desktop
- [ ] Avatar 48px consistente en todos tamaños

---

## 🎨 ANIMACIONES Y TRANSICIONES

### Cards de Proveedores
- [ ] Animación fade-in al cargar lista
- [ ] Stagger delay 50ms incremental por card
- [ ] Hover scale-[1.02] suave
- [ ] Hover shadow-xl aparece progresivamente
- [ ] Hover border-primary/20 sutil
- [ ] Transition duration 200ms consistente

### Quick Actions
- [ ] opacity-0 inicial en desktop
- [ ] group-hover:opacity-100 suave
- [ ] transition-opacity duration-200
- [ ] No jump/flickering al aparecer

### Stats Cards
- [ ] Hover scale-[1.04] más prominente que provider cards
- [ ] duration-200 transition-all
- [ ] Shadow crece en hover
- [ ] Clickeable tiene cursor-pointer

### Dialogs
- [ ] Abrir con animación fade-in
- [ ] Overlay backdrop con fade
- [ ] Cerrar con animación fade-out
- [ ] No stuttering/lag durante animaciones

### Badges
- [ ] Colores vibrantes con gradientes
- [ ] Transitions en cambios de estado
- [ ] Badges en overlay con fade-in

---

## 🌙 DARK MODE

### Provider Cards
- [ ] Gradient dark:from-blue-950/20 dark:to-indigo-950/20
- [ ] Texto foreground legible
- [ ] Badges contraste correcto
- [ ] Borders dark:border-gray-800 visibles
- [ ] Avatar gradient consistente en ambos modos

### Stats Cards
- [ ] Gradientes adaptan en dark mode
- [ ] Text colors usando variables HSL
- [ ] Badges verde/naranja legibles en dark
- [ ] Hover effects visibles

### Dialogs
- [ ] Background dark:bg-gray-900
- [ ] Header separators visibles
- [ ] Tabs backgrounds correctos
- [ ] Form inputs dark mode completo

### Mini-Cards en Overlay
- [ ] Gradientes sutiles funcionan
- [ ] Texto readable en dark
- [ ] Badges status legibles
- [ ] Hover effects visibles

### Consistencia
- [ ] NO colores hardcodeados (hex/rgb)
- [ ] Todos usan variables HSL de tema
- [ ] Switching entre modos sin flash
- [ ] Estados hover/focus visibles en ambos modos

---

## 🔍 FILTROS Y BÚSQUEDA

### Búsqueda con Debounce
- [ ] Input búsqueda con ícono Search
- [ ] Placeholder "Buscar por nombre, código o RFC..."
- [ ] Debounce 300ms (no búsqueda instantánea)
- [ ] Buscar por nombre (case insensitive) → filtra
- [ ] Buscar por code_short → filtra
- [ ] Buscar por RFC → filtra
- [ ] Búsqueda vacía → muestra todos

### Pills de Filtros
- [ ] Popover en desktop con pills toggleables
- [ ] Sheet bottom drawer en mobile
- [ ] Pills: Activos, Inactivos, Con Términos, Sin Términos
- [ ] Click pill → activa/desactiva toggle
- [ ] Pills activas muestran diferente estilo

### Applied Filters Chips
- [ ] Filtros aplicados muestran chips removibles
- [ ] Click X en chip → remueve filtro individual
- [ ] Badge contador "(3)" si múltiples filtros
- [ ] Botón "Limpiar todo" aparece si >0 filtros

### Combinaciones de Filtros
- [ ] Activos + Con Términos → solo activos CON términos
- [ ] Inactivos + Sin Términos → solo inactivos SIN términos
- [ ] Búsqueda + Filtro status → ambos aplican (AND)
- [ ] Múltiples filtros respetan lógica AND

### Empty States con Filtros
- [ ] Aplicar filtros que no coinciden → empty state
- [ ] Mensaje explica que no hay resultados con filtros
- [ ] Botón para limpiar filtros presente

---

## ⚡ PERFORMANCE

### Carga Inicial
- [ ] Lista de 100 proveedores carga en <1 segundo
- [ ] Skeleton loaders aparecen mientras carga
- [ ] Shimmer effect en skeletons
- [ ] Sin layout shift al cargar

### Búsqueda y Filtros
- [ ] Debounce 300ms previene lag
- [ ] Filtrar lista de 100 items instantáneo (<100ms)
- [ ] No re-renders innecesarios durante búsqueda
- [ ] UI responsive durante filtrado

### Stats Cards Calculation
- [ ] useProviderStats calcula stats en <200ms
- [ ] Queries memoizadas (staleTime: 2 min)
- [ ] hasTerms() ejecuta eficientemente
- [ ] No re-cálculos innecesarios

### Animaciones
- [ ] Todas las animaciones a 60fps
- [ ] No stuttering en scroll
- [ ] Hover effects suaves sin lag
- [ ] Stagger animations no causan lag

### Memory Usage
- [ ] No memory leaks en mount/unmount de dialogs
- [ ] Queries se limpian correctamente
- [ ] useEffect cleanup functions presentes

---

## ✅ CRUD COMPLETO

### Crear (Wizard)
- [ ] Botón "Nuevo Proveedor" abre wizard
- [ ] Step 1: Información Básica validaciones OK
- [ ] code_short uppercase automático + max 6 caracteres
- [ ] No permite avanzar sin name
- [ ] Step 2: Datos Fiscales valida RFC format
- [ ] Régimen fiscal dropdown funciona
- [ ] Modo manual activa input adicional
- [ ] Step 3: Contacto es opcional (puede saltar vacío)
- [ ] Step 4: Preview muestra todos los datos
- [ ] Guardar crea proveedor → toast success
- [ ] Lista actualiza sin refresh

### Editar (Edit Form)
- [ ] Click "Editar" abre form con tabs
- [ ] Todos los campos pre-poblados (FASE 0)
- [ ] code_short disabled (no editable)
- [ ] Modificar name → guardar → actualiza
- [ ] Toggle activo/inactivo funciona
- [ ] Guardar → toast success → lista actualiza

### Ver Detalles
- [ ] Click "Ver Detalles" abre ProviderDetailsDialogModern
- [ ] 4 tabs funcionales (Info, Fiscales, Términos, Uso)
- [ ] Tab "Uso en Proyectos" muestra gráfico
- [ ] Timeline de presupuestos si proveedor usado
- [ ] Dark mode completo en details dialog

### Eliminar (Dos Pasos - FASE 1)
- [ ] Soft delete funciona (activo → inactivo)
- [ ] Hard delete funciona (inactivo → borrado)
- [ ] Validación de uso previene borrado si en presupuestos
- [ ] Mensajes de confirmación claros

---

## 📥📤 IMPORT / EXPORT

### Export
- [ ] Botón "Exportar" genera CSV
- [ ] CSV contiene todas las columnas
- [ ] Respeta filtros aplicados (solo exporta filtrados)
- [ ] Descarga automática del archivo
- [ ] Nombre archivo incluye timestamp

### Import (Pendiente - No en Fase 1)
- [ ] ImportDialog placeholder presente
- [ ] (Funcionalidad completa en fases posteriores)

---

## 🎯 CRITERIOS DE ACEPTACIÓN GLOBAL

### Funcionalidad
- [ ] CRUD completo funciona en mobile/tablet/desktop
- [ ] Validaciones previenen datos incorrectos
- [ ] Mensajes de error claros y descriptivos
- [ ] Toast confirmaciones en todas las acciones

### UX/UI
- [ ] NO scroll horizontal en ningún viewport
- [ ] Animaciones suaves a 60fps
- [ ] Hover effects intuitivos
- [ ] Loading states presentes

### Accesibilidad
- [ ] Navegación por teclado funciona
- [ ] Focus indicators visibles
- [ ] Buttons tienen title/aria-label
- [ ] Colores tienen contraste adecuado

### Performance
- [ ] 100 proveedores carga <1s
- [ ] Búsqueda debounced sin lag
- [ ] No memory leaks

### Dark Mode
- [ ] Todos componentes funcionan en ambos modos
- [ ] Consistencia de colores HSL
- [ ] Readable en ambos temas

---

## 📊 RESUMEN FINAL

**Total Checkboxes**: ~200+

### Por Fase:
- FASE 0 (Pre-población): 22 tests
- FASE 1 (Eliminación): 24 tests
- FASE 2 (Stats Cards): 20 tests
- FASE 3 (Overlays): 22 tests
- FASE 4 (Responsive): 26 tests

### Por Categoría:
- Animaciones: 16 tests
- Dark Mode: 22 tests
- Filtros: 18 tests
- Performance: 14 tests
- CRUD: 16 tests
- Import/Export: 6 tests

---

## ⚠️ NOTAS IMPORTANTES

1. **Testing debe ser MANUAL** en preview con diferentes devices
2. **Dark mode** se prueba con theme toggle en header
3. **Responsive** se prueba redimensionando browser o usando DevTools
4. **Performance** observable en Network tab y rendering
5. **NO marcar fase completa** si algún test falla

---

## 🚀 SIGUIENTE PASO DESPUÉS DE TESTING

Si todos los tests pasan → **Fase 1 de Modernización COMPLETA al 100%** ✅

Si hay issues → Documentar y crear issues específicos para corregir antes de declarar completitud.

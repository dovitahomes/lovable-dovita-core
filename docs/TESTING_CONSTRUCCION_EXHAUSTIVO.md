# Testing Exhaustivo - Modernización Construcción
## Plan Maestro de Verificación de las 7 Fases

**Objetivo**: Verificar al 100% la funcionalidad completa de la modernización de Construcción en múltiples viewports con dark mode.

---

## 🔍 FASE 1: Restructuración de Navegación

### Desktop (≥1024px)
- [ ] Navegar a `/construccion/:id` muestra dashboard con 4 cards grandes
- [ ] Card "Etapas y Avance" muestra estadísticas correctas (etapas activas, progreso global)
- [ ] Card "Fotografías de Obra" muestra total de fotos y fotos de la semana
- [ ] Card "Materiales y Compras" muestra OCs activas y pendientes
- [ ] Card "Equipo de Proyecto" muestra miembros y equipo en sitio hoy
- [ ] Click en "Etapas y Avance" navega a `/construccion/:id/etapas`
- [ ] Click en "Fotografías de Obra" navega a `/construccion/:id/fotos`
- [ ] Click en "Materiales y Compras" navega a `/construccion/:id/materiales`
- [ ] Click en "Equipo de Proyecto" navega a `/construccion/:id/equipo`
- [ ] Gradientes de cards renderean correctamente
- [ ] Hover effects funcionan (scale, shadow)
- [ ] Animaciones fade-in aparecen al cargar
- [ ] DashboardCard es reutilizable y responsive

### Tablet (768px - 1023px)
- [ ] Cards se ajustan a grid de 2 columnas
- [ ] Títulos siguen siendo legibles
- [ ] Iconos mantienen tamaño apropiado
- [ ] Spacing entre cards es adecuado
- [ ] Navegación funciona igual que desktop

### Mobile (375px - 767px)
- [ ] Cards apilados en single column
- [ ] Títulos ajustados (text-2xl sm:text-3xl)
- [ ] Stats cards compactas pero legibles
- [ ] Touch targets suficientemente grandes (min 44px)
- [ ] Sin scroll horizontal NUNCA
- [ ] Navegación funciona en mobile

### Dark Mode (Todas las resoluciones)
- [ ] Fondo de cards usa variables HSL correctas
- [ ] Texto tiene contraste suficiente (WCAG AA)
- [ ] Gradientes se ven bien en dark mode
- [ ] Borders y separadores visibles
- [ ] Iconos colorizados correctamente

---

## 🗄️ FASE 2: Mejoras en Base de Datos

### Verificación de Schema
- [ ] Tabla `construction_photos` tiene columna `stage_id` (UUID FK)
- [ ] Tabla `construction_photos` tiene columna `categoria` (TEXT con CHECK)
- [ ] Tabla `construction_photos` tiene columna `metadata` (JSONB)
- [ ] Tabla `construction_photos` tiene columna `is_active` (BOOLEAN)
- [ ] Índice `idx_construction_photos_project_stage` existe
- [ ] Índice `idx_construction_photos_project_date` existe
- [ ] Índice `idx_construction_photos_fecha_desc` existe
- [ ] Índice `idx_construction_photos_stage` existe
- [ ] Índice `idx_construction_photos_categoria` existe

### Vista v_client_photos
- [ ] Vista incluye columna `categoria`
- [ ] Vista incluye columna `stage_id`
- [ ] Vista incluye columna `stage_name` (via JOIN)
- [ ] Vista incluye columna `metadata`
- [ ] Vista filtra por `is_active = true`

### Funciones SQL Helper
- [ ] Función `get_photos_by_category(project_id, categoria)` funciona
- [ ] Función `get_geolocated_photos(project_id)` funciona
- [ ] Ambas funciones retornan datos correctos

### Constantes TypeScript
- [ ] `PHOTO_CATEGORIES` tiene 7 categorías con iconos Lucide
- [ ] Categorías: cimentacion, estructura, albanileria, instalaciones, acabados, exteriores, otros
- [ ] Iconos mapeados correctamente

### Hooks Actualizados
- [ ] `useConstructionPhotosUpload` acepta `categoria` y `stageId`
- [ ] `useConstructionStats` filtra por `is_active = true`
- [ ] `useProjectPhotos` filtra por `is_active = true`

---

## 📱 FASE 3: Versión Móvil para Ingenieros

### FAB Button (Mobile Only)
- [ ] FAB button visible en bottom-right en `/construccion/:id/fotos` mobile
- [ ] Animación pulse activa constantemente
- [ ] Click en FAB abre `MobilePhotoUploadForm`
- [ ] FAB no bloquea contenido importante
- [ ] FAB tiene z-index correcto
- [ ] Touch target es suficientemente grande

### MobilePhotoUploadForm - Step 1: Captura
- [ ] Input file con `accept="image/*"` y `capture="environment"`
- [ ] Abre cámara nativa directamente
- [ ] Preview de imagen capturada aparece
- [ ] Botón "Continuar" funcional
- [ ] Botón "Cancelar" cierra wizard
- [ ] Loading state durante upload

### MobilePhotoUploadForm - Step 2: Etapa
- [ ] `QuickStageSelector` muestra etapas del proyecto
- [ ] Cards de etapas tienen nombre y progreso %
- [ ] Click selecciona etapa (highlight visual)
- [ ] Botón "Siguiente" habilitado solo si etapa seleccionada

### MobilePhotoUploadForm - Step 3: Categoría
- [ ] `CategorySelector` muestra 7 categorías con iconos
- [ ] Iconos Lucide correctos (Foundation, Building, Zap, Paintbrush, etc.)
- [ ] Click selecciona categoría (highlight visual)
- [ ] Botón "Siguiente" habilitado solo si categoría seleccionada

### MobilePhotoUploadForm - Step 4: Descripción
- [ ] `VoiceToTextInput` renderiza textarea
- [ ] Botón de micrófono visible si Web Speech API soportado
- [ ] Click en micrófono inicia grabación (indicador visual)
- [ ] Transcripción aparece en textarea automáticamente
- [ ] Descripción es opcional (puede saltarse)
- [ ] Botón "Subir Foto" siempre habilitado

### Geolocalización Automática
- [ ] Progress bar circular aparece al capturar foto
- [ ] Navigator.geolocation.getCurrentPosition() se ejecuta
- [ ] Latitud y longitud se capturan correctamente
- [ ] Toast "Ubicación capturada ✓" aparece
- [ ] Manejo de error si geolocalización denegada

### Upload y Confirmación
- [ ] Botón "Subir Foto" inicia upload a `project_photos` bucket
- [ ] Progress bar animado durante upload
- [ ] Toast de confirmación con preview thumbnail
- [ ] Wizard se cierra automáticamente tras éxito
- [ ] Galería se actualiza con nueva foto (invalidate query)
- [ ] Manejo de errores con toast de error

### Galería Mobile Optimizada
- [ ] `ConstruccionFotosMobile` renderiza en mobile (<768px)
- [ ] `PhotoCardMobile` muestra fotos con mini-mapa
- [ ] Infinite scroll funciona (carga más fotos al hacer scroll down)
- [ ] Skeleton loaders mientras carga
- [ ] Empty state si no hay fotos

### Performance Mobile
- [ ] Upload completo en <10 segundos con conexión 4G
- [ ] Fotos se comprimen antes de subir (tamaño razonable)
- [ ] Gestures touch funcionan sin lag
- [ ] Sin memory leaks al subir múltiples fotos

---

## 🗺️ FASE 4: Mapas Interactivos

### MapPreview Component - Variant: thumbnail
- [ ] Renderiza en `PhotoCard` cuando foto tiene lat/lng
- [ ] Tamaño 100x100px
- [ ] Usa Google Maps Static API correctamente
- [ ] URL completa sin errores 404
- [ ] Hover effect con scale
- [ ] Ícono `MapPin` visible en overlay
- [ ] Click abre `MapDialog`

### MapPreview Component - Variant: mini
- [ ] Renderiza en sidebars con 200px height
- [ ] Iframe embebido de Google Maps
- [ ] Enlace "Ver en Google Maps" funcional
- [ ] Botón con ícono `MapPin`
- [ ] Responsive en mobile/tablet

### MapPreview Component - Variant: full
- [ ] Renderiza en `MapDialog` con 400px height
- [ ] Iframe embebido con controles completos
- [ ] Zoom, pan, street view funcionan
- [ ] Dropped pin rojo en ubicación exacta

### MapDialog Component
- [ ] Dialog se abre al click en mini-mapa thumbnail
- [ ] Mapa full width con iframe embebido
- [ ] Botón "Abrir en Google Maps" abre app nativa o web
- [ ] Botón "Cómo Llegar" inicia navegación GPS
- [ ] Botón "Compartir Ubicación" usa Web Share API
- [ ] Fallback a clipboard si Web Share no soportado
- [ ] Toast de confirmación al copiar coordenadas
- [ ] Dialog se cierra con botón X o click fuera

### Integración en ConstructionPhotosTab (Desktop)
- [ ] Mini-map thumbnails aparecen en photo cards con geolocalización
- [ ] Layout grid-cols-[1fr_100px] funciona
- [ ] Imagen principal + mini-mapa lado a lado
- [ ] Fotos sin geolocalización se muestran normalmente
- [ ] Botón "View Full Map" funcional
- [ ] Click en mini-map abre `MapDialog`

### Integración en PhotoCardMobile (Mobile)
- [ ] Mini-map thumbnails integrados en cards mobile
- [ ] Callback `onViewMap` funcional
- [ ] Click en mini-map abre `MapDialog`
- [ ] Touch gestures funcionan correctamente

### Google Maps API Key
- [ ] API Key `AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8` válida
- [ ] Static API habilitada
- [ ] Embed API habilitada
- [ ] Sin errores 403 o 401
- [ ] Requests no exceden cuota

### Verificación URLs
- [ ] `getStaticMapUrl()` genera URLs válidas
- [ ] `getEmbedMapUrl()` genera URLs válidas
- [ ] Sin duplicación de `https://` en URLs
- [ ] Markers rojos visibles en mapas estáticos

---

## 🔍 FASE 5: Filtros y Agrupación

### PhotoFilters Component - Desktop
- [ ] Popover se abre al click en botón "Filtros"
- [ ] Input de búsqueda filtra por descripción
- [ ] Selector de etapa muestra etapas del proyecto
- [ ] Selector de categoría muestra 7 categorías con iconos
- [ ] Date range picker funciona (fecha inicio/fin)
- [ ] Checkbox "Con Ubicación" filtra fotos geolocalizadas
- [ ] Botón "Limpiar Filtros" resetea todo
- [ ] Filtros activos muestran chips removibles
- [ ] Click en X de chip remueve filtro individual

### PhotoFilters Component - Mobile
- [ ] Sheet bottom drawer se abre al click en botón "Filtros"
- [ ] Sheet ocupa 80vh con scroll interno
- [ ] Filtros funcionan igual que desktop
- [ ] Touch targets suficientemente grandes
- [ ] Botón "Aplicar Filtros" cierra Sheet

### Filtrado en Tiempo Real
- [ ] Filtros se aplican inmediatamente al cambiar
- [ ] Query de fotos se re-ejecuta con nuevos parámetros
- [ ] Loading skeleton aparece durante re-fetch
- [ ] Contador de resultados actualizado
- [ ] Sin fotos encontradas → empty state apropiado

### PhotoWeekGroup Component
- [ ] Fotos agrupadas por semana correctamente
- [ ] Header sticky con formato "Semana del dd MMM yyyy"
- [ ] Badge con contador de fotos de esa semana
- [ ] Highlight especial para semana actual (`isCurrentWeek`)
- [ ] Grid de `PhotoCardWithMap` dentro de cada grupo
- [ ] Spacing adecuado entre grupos

### Helper Functions
- [ ] `groupPhotosByWeek()` usa `startOfWeek` de date-fns
- [ ] `isCurrentWeek()` detecta semana actual correctamente
- [ ] Fotos ordenadas por `fecha_foto` DESC dentro de cada grupo

### Integración en ConstruccionFotosMobile
- [ ] Filtros funcionan en mobile
- [ ] Agrupación por semana visible
- [ ] PhotoWeekGroups renderizan correctamente
- [ ] Scroll vertical suave sin jank

### Integración en ConstructionPhotosTab
- [ ] Filtros funcionan en desktop
- [ ] Agrupación por semana visible
- [ ] PhotoWeekGroups renderizan correctamente
- [ ] Tabs "Galería/Timeline/Mapa" no rompen filtros

### Estados Vacíos Mejorados
- [ ] Empty state cuando no hay fotos
- [ ] Empty state cuando filtros no devuelven resultados
- [ ] Mensaje diferenciado para cada caso
- [ ] Botón "Limpiar Filtros" en empty state de filtros

---

## 📷 FASE 6: Integración Client App

### Photos.tsx (Client App Mobile)
- [ ] Mini-mapas aparecen en photo cards con geolocalización
- [ ] Layout grid-cols-[1fr_100px] funciona
- [ ] Fotos sin geolocalización se muestran normalmente
- [ ] Click en mini-mapa abre dialog con mapa full
- [ ] Navegación entre páginas sigue funcionando
- [ ] Mock data toggle respetado

### PhotosDesktop.tsx (Client App Desktop)
- [ ] Mini-mapas aparecen en photo cards con geolocalización
- [ ] Layout grid-cols-[1fr_100px] funciona
- [ ] Fotos sin geolocalización se muestran normalmente
- [ ] Click en mini-mapa abre dialog con mapa full
- [ ] Navegación entre páginas sigue funcionando
- [ ] Mock data toggle respetado

### PhotoViewer.tsx (Client App)
- [ ] Sidebar muestra `MapPreview` variant="mini"
- [ ] Label "Ubicación de la Foto" visible
- [ ] Mapa de 250px height funciona
- [ ] Solo aparece si foto tiene lat/lng
- [ ] Fotos sin geolocalización no rompen viewer
- [ ] Botones de acción (Compartir/Descargar) funcionan

### Verificación de No-Regresión
- [ ] Client App mobile funciona perfectamente
- [ ] Client App desktop funciona perfectamente
- [ ] Routing no afectado
- [ ] Mock data toggle sigue funcionando
- [ ] Navegación entre Dashboard/Financial/Documents/Chat/Appointments intacta
- [ ] No aparecen errores en console

### Mapas en Client App
- [ ] Google Maps Static API funciona en Client App
- [ ] Signed URLs de fotos cargan correctamente
- [ ] Dialog de mapa funciona en touch devices
- [ ] Botones de acción (Compartir) usan Web Share API

---

## 📊 FASE 7: Timeline + Responsive

### ConstructionTimeline Component
- [ ] Timeline muestra todas las etapas del proyecto
- [ ] Cards con línea conectora vertical entre etapas
- [ ] Iconos de estado (CheckCircle2, Clock, Calendar)
- [ ] Colores dinámicos según progreso (verde ≥100%, azul >0%, gris 0%)
- [ ] Badges con cantidad de fotos por etapa
- [ ] Progress bar con % de avance
- [ ] Fechas inicio/fin formateadas correctamente
- [ ] Última foto registrada con timestamp completo
- [ ] Hover effect en cards
- [ ] Animaciones fade-in

### PhotosMapView Component
- [ ] Script de Google Maps JavaScript API carga async
- [ ] Mapa se inicializa centrado en primera foto
- [ ] Markers circulares azules en cada foto geolocalizada
- [ ] Bounds automático incluye todos los markers
- [ ] Vista híbrida (satellite + labels) por defecto
- [ ] Controles de mapa (zoom, street view, fullscreen) funcionan
- [ ] Click en marker muestra `PhotoInfoCard`
- [ ] PhotoInfoCard muestra thumbnail, descripción, etapa, fecha
- [ ] Botón X cierra PhotoInfoCard
- [ ] Sin fotos geolocalizadas → empty state apropiado

### Tabs en ConstruccionFotos.tsx
- [ ] 3 tabs: Galería, Timeline, Mapa
- [ ] Iconos correctos (Grid3x3, Activity, Map)
- [ ] Tab "Galería" muestra `ConstructionPhotosTab`
- [ ] Tab "Timeline" muestra `ConstructionTimeline`
- [ ] Tab "Mapa" muestra `PhotosMapView`
- [ ] Navegación entre tabs sin perder estado
- [ ] Tabs responsive con labels ocultos en mobile

### Desktop (≥1024px)
- [ ] Timeline cards stack vertical con spacing adecuado
- [ ] Mapa de 500px height con controles completos
- [ ] Tabs con iconos + labels visibles
- [ ] Sin scroll horizontal

### Tablet (768px - 1023px)
- [ ] Timeline cards adaptan ancho correctamente
- [ ] Mapa responsive ocupa ancho completo
- [ ] Tabs condensados con iconos + labels cortos

### Mobile (≤767px)
- [ ] Timeline cards compactas sin overflow
- [ ] Mapa funciona con touch gestures
- [ ] Tabs solo muestran iconos (labels hidden)
- [ ] PhotoInfoCard adaptada a ancho móvil
- [ ] Click en markers funciona en touch
- [ ] Sin scroll horizontal NUNCA

### Queries SQL Performance
- [ ] Query de timeline con JOIN eficiente
- [ ] Contador de fotos por etapa calculado correctamente
- [ ] Query de fotos geolocalizadas filtra lat/lng NOT NULL
- [ ] Índices utilizados correctamente
- [ ] Queries <500ms con 100+ fotos

---

## 🌓 DARK MODE (Verificación Global)

### Construcción Dashboard
- [ ] Cards con fondo apropiado (background vs card)
- [ ] Gradientes se ven bien en dark
- [ ] Texto con contraste suficiente (WCAG AA)
- [ ] Iconos colorizados correctamente
- [ ] Borders y separadores visibles

### Fotografías - Galería
- [ ] Photo cards con fondo apropiado
- [ ] Filtros popover/sheet readable en dark
- [ ] Week group headers legibles
- [ ] Mini-mapas tienen buen contraste
- [ ] Skeleton loaders shimmer visible

### Fotografías - Timeline
- [ ] Timeline cards legibles
- [ ] Progress bars colorizadas correctamente
- [ ] Líneas conectoras visibles
- [ ] Badges con contraste suficiente

### Fotografías - Mapa
- [ ] PhotoInfoCard legible en dark
- [ ] Controles de Google Maps visibles
- [ ] Sin elementos blancos que cieguen

### Mobile Upload Wizard
- [ ] Wizard steps legibles en dark
- [ ] Preview de imagen con buen contraste
- [ ] Botones destacados correctamente
- [ ] Progress indicators visibles

### Client App
- [ ] Mini-mapas tienen buen contraste
- [ ] PhotoViewer sidebar legible en dark
- [ ] MapDialog funciona en dark mode

---

## 🚀 PERFORMANCE (Métricas Objetivo)

### Construcción Dashboard
- [ ] FCP <1.5s (First Contentful Paint)
- [ ] LCP <2.5s (Largest Contentful Paint)
- [ ] TTI <3.0s (Time to Interactive)
- [ ] Sin layout shifts (CLS < 0.1)

### Fotografías - Galería
- [ ] Grid de 100+ fotos renderiza sin lag
- [ ] Scroll suave a 60fps
- [ ] Lazy loading de imágenes funcional
- [ ] Skeleton loaders inmediatos

### Fotografías - Timeline
- [ ] 10+ etapas renderizan instantáneamente
- [ ] Animaciones smooth sin jank

### Fotografías - Mapa
- [ ] Script de Google Maps carga <1s
- [ ] Mapa interactivo en <2s
- [ ] 50+ markers renderizan sin lag
- [ ] Pan/zoom fluidos a 60fps

### Mobile Upload
- [ ] Captura de foto <1s
- [ ] Geolocalización <2s
- [ ] Upload completo <10s (4G)
- [ ] UI responsive durante upload

---

## 🔄 INTEGRACIÓN E2E (End-to-End)

### Flujo Completo: Ingeniero en Sitio
1. [ ] Ingeniero abre app en mobile (Android/iOS)
2. [ ] Navega a `/construccion/:id/fotos`
3. [ ] Click en FAB button
4. [ ] Toma foto con cámara nativa
5. [ ] Selecciona etapa rápidamente
6. [ ] Selecciona categoría con iconos
7. [ ] Agrega descripción (opcional, voz a texto)
8. [ ] Foto se sube con geolocalización automática
9. [ ] Toast de confirmación con preview
10. [ ] Foto aparece en galería inmediatamente
11. [ ] Foto aparece en timeline de su etapa
12. [ ] Foto aparece en mapa con marker
**Tiempo total**: <10 segundos

### Flujo Completo: Cliente en Portal
1. [ ] Cliente abre Client App
2. [ ] Navega a Photos
3. [ ] Ve fotos con mini-mapas
4. [ ] Click en mini-mapa abre dialog
5. [ ] Ve ubicación exacta en Google Maps
6. [ ] Click en "Abrir en Google Maps" funciona
7. [ ] Navegación GPS inicia correctamente
8. [ ] Cliente ve progreso fotográfico en galería
**Sin errores ni regresiones**

### Flujo Completo: Administrador en ERP
1. [ ] Admin abre ERP Desktop
2. [ ] Navega a `/construccion/:id`
3. [ ] Ve dashboard con stats actualizadas
4. [ ] Click en "Fotografías de Obra"
5. [ ] Ve 3 tabs: Galería, Timeline, Mapa
6. [ ] Tab Galería: filtra por etapa/categoría/fecha
7. [ ] Tab Timeline: ve progreso fotográfico por etapa
8. [ ] Tab Mapa: ve todas las fotos geolocalizadas con markers
9. [ ] Cambia entre tabs sin perder estado
10. [ ] Cambia a dark mode → todo funciona perfectamente
**Experiencia fluida y profesional**

---

## ✅ CRITERIOS DE ACEPTACIÓN FINAL

### Funcionalidad ✅
- [ ] TODAS las features implementadas funcionan correctamente
- [ ] CERO errores en console (warnings permitidos si son de librerías)
- [ ] Navegación fluida sin dead ends
- [ ] Filtros retornan resultados correctos
- [ ] Mapas cargan y funcionan sin errores 403/404
- [ ] Upload funciona en mobile y desktop
- [ ] Geolocalización captura coordenadas correctas

### Responsive ✅
- [ ] Mobile 375px: sin scroll horizontal, touch targets adecuados
- [ ] Tablet 768px: layout adaptado correctamente
- [ ] Desktop 1024px+: aprovecha espacio disponible
- [ ] Entre breakpoints: transiciones suaves

### Dark Mode ✅
- [ ] Contraste WCAG AA en todos los componentes
- [ ] Variables HSL usadas correctamente
- [ ] Sin colores hardcodeados
- [ ] Elementos visibles sin "ceguera"

### Performance ✅
- [ ] LCP <2.5s en mobile 4G
- [ ] Scroll a 60fps con 100+ fotos
- [ ] Mapas interactivos sin lag
- [ ] Upload completo en <10s

### UX ✅
- [ ] Flujos intuitivos sin confusión
- [ ] Loading states claros
- [ ] Empty states amigables
- [ ] Error handling con toasts informativos
- [ ] Animaciones profesionales sin exageración

---

## 📝 NOTAS DE TESTING

**Dispositivos Recomendados**:
- iPhone SE (375px mobile)
- iPad (768px tablet)
- MacBook Pro (1440px desktop)

**Navegadores**:
- Chrome/Edge (Desktop/Mobile)
- Safari (Desktop/Mobile)
- Firefox (Desktop)

**Condiciones de Red**:
- 4G Fast (normal)
- 3G Slow (testing performance)
- Offline (testing error handling)

**Datos de Prueba**:
- Proyecto con 5+ etapas
- 50+ fotos con geolocalización variada
- Fotos sin geolocalización (para verificar fallback)
- Fotos de todas las categorías (7 tipos)
- Mezcla de fechas (varias semanas)

---

## 🎯 RESULTADO ESPERADO

Al completar este checklist exhaustivo al 100%, la modernización de Construcción debe estar lista para producción con calidad de clase mundial, rivalando con software especializado de gestión de obras pero adaptado específicamente a construcción residencial.

**Modernización de Construcción: 7 fases, 22 horas, 100% COMPLETO** ✅

# Wiring FE ↔ Supabase: Construcción (Fotos, Documentos, Calendario)

## Objetivo

Conectar la UI del módulo de Construcción (Staff) y Client App (Cliente) a Supabase DB + Storage usando datos reales por defecto, con respeto al toggle de mock data en la Preview Bar.

## Hooks Unificados Implementados

### 1. `useProjectPhotos(projectId)`

**Decisión vista vs tabla:**
- **Cliente**: Lee desde `v_client_photos` (filtra `visibilidad='cliente'`)
- **Staff/Admin**: Lee desde `construction_photos` (todos los registros)

**Storage:**
- Bucket: `project_photos` (privado)
- Path: `{projectId}/{YYYY}/{MM}/{uuid}-{filename}.ext`
- URLs: Signed URLs con expiración de 3600s

**Ubicación:** `src/hooks/useProjectPhotos.ts`

---

### 2. `useUnifiedProjectDocuments(projectId)`

**Decisión vista vs tabla:**
- **Cliente**: Lee desde `v_client_documents` (filtra `visibilidad='cliente'`)
- **Staff/Admin**: Lee desde `documents` (todos los registros)

**Storage:**
- Bucket: `project_docs` (privado)
- Path: `{projectId}/docs/{categoria}/{uuid}-{filename}.ext`
- URLs: Signed URLs con expiración de 3600s

**Ubicación:** `src/hooks/useUnifiedProjectDocuments.ts`

---

### 3. `useProjectAppointments(projectId)`

**Decisión vista vs tabla:**
- **Cliente**: Lee desde `v_client_events` (filtra eventos ≥ hoy, visibilidad implícita)
- **Staff/Admin**: Lee desde `project_events` (todos los registros)

**Mutations (solo Staff/Admin):**
- `useCreateAppointment()`: Inserta en `project_events`
- `useUpdateAppointment()`: Actualiza evento existente
- `useDeleteAppointment()`: Elimina evento

**Ubicación:** `src/hooks/useProjectAppointments.ts`

---

## Componentes Staff (Construcción)

### `ConstructionPhotosTab`

- Upload de fotos con drag & drop
- Campos: descripción, lat/lng (geolocation automática), visibilidad (interno/cliente)
- Galería con preview usando signed URLs
- Botones: Ver, Eliminar
- **Mutation:** `useConstructionPhotosUpload()`

**Ubicación:** `src/components/construction/ConstructionPhotosTab.tsx`

---

### `ProjectDocumentsTab`

- Upload de documentos con drag & drop
- Campos: categoría, visibilidad, etiqueta opcional
- Categorías: general, contratos, planos, presupuestos, facturas, permisos
- Lista con nombre, tamaño, fecha relativa, badges de visibilidad
- Botones: Descargar (signed URL), Eliminar
- **Mutation:** `useDocumentsUpload()`

**Ubicación:** `src/components/project/ProjectDocumentsTab.tsx`

---

### `ProjectCalendarTab` (pendiente de implementar CRUD)

- Vista de calendario con eventos
- **Mutations pendientes:** `useCreateAppointment`, `useUpdateAppointment`, `useDeleteAppointment`
- Filtro "Solo visibles al cliente"

**Ubicación:** `src/components/project/ProjectCalendarTab.tsx` (existente, requiere integración)

---

## Client App (Vistas)

Los hooks unificados detectan automáticamente si el usuario es cliente y consumen las vistas `v_client_*` en lugar de las tablas operativas.

- **Fotos:** `useProjectPhotos` → `v_client_photos`
- **Documentos:** `useUnifiedProjectDocuments` → `v_client_documents`
- **Calendario:** `useProjectAppointments` → `v_client_events`

---

## Toggle de Mock Data (Preview Bar)

**Contextos:**
- `DataSourceContext`: Maneja `source` ('mock' | 'real') y `forceClientId`
- `ClientDataModeProvider`: Maneja `useMock` (boolean)

**Funcionamiento:**
1. Preview Bar permite alternar entre Mock Data (ON) y Datos Reales (OFF)
2. Por defecto: OFF (datos reales)
3. En producción: `useMock` forzado a `false`
4. Los hooks de Client App respetan `useMock` para decidir entre fixtures o queries reales

**Ubicación:**
- `src/contexts/client-app/DataSourceContext.tsx`
- `src/contexts/client-app/ClientDataModeProvider.tsx`
- `src/components/client-app/PreviewBar.tsx`

---

## Storage Helpers Reutilizados

**Ubicación:** `src/lib/storage-helpers.ts` (barrel export)

**Funciones:**
- `uploadToBucket({ bucket, projectId, file, filename })` → `{ path }`
- `getSignedUrl({ bucket, path, expiresInSeconds })` → `{ url }`
- `deleteFromBucket(bucket, path)` → `boolean`

**Validaciones automáticas:**
- Tamaño máximo: 10 MB
- Tipos permitidos:
  - Fotos: `image/jpeg`, `image/png`, `image/webp`
  - Docs: PDF, Word, Excel, imágenes

---

## Flujo de Subida (Staff)

1. Usuario arrastra archivo al dropzone
2. Validación de tamaño/tipo
3. Obtener `user.id` autenticado
4. `uploadToBucket()` → guarda en Storage, retorna `path`
5. Insertar registro en DB con `file_url = path` (NO full URL)
6. **Si falla DB insert:** `deleteFromBucket()` (cleanup)
7. Toast de éxito/error
8. Invalidar query para refrescar lista

---

## Flujo de Lectura (Cliente)

1. Hook detecta rol `cliente` vía `user_roles`
2. Query a vista `v_client_*` con filtro `project_id`
3. Para cada registro, generar signed URL:
   ```ts
   const { url } = await getSignedUrl({
     bucket: 'project_photos',
     path: photo.file_url,
     expiresInSeconds: 3600
   });
   ```
4. Renderizar con `url` (no `file_url` directamente)

---

## Permisos RLS (No Modificados)

Las políticas ya existentes permiten:
- **Cliente**: `SELECT` en vistas `v_client_*` (filtran por `project_id` y `visibilidad`)
- **Staff/Admin**: `ALL` en tablas operativas según `user_has_module_permission()`

No se requieren cambios a RLS para este wiring.

---

## QA Manual (Checklist)

- [ ] Cliente ve solo documentos marcados como `visibilidad='cliente'`
- [ ] Staff puede subir foto/documento y cambiar visibilidad
- [ ] Todas las descargas usan signed URLs (no getPublicUrl)
- [ ] Navegar a proyecto muestra conteos correctos
- [ ] Toggle Mock ON → usa fixtures; OFF → queries reales
- [ ] Upload falla si DB insert falla (cleanup automático)
- [ ] Fotos muestran lat/lng si están disponibles
- [ ] Documentos muestran tamaño, fecha relativa y badge de visibilidad

---

## Pendientes

- [ ] Implementar CRUD completo en `ProjectCalendarTab` para staff (crear/editar/eliminar eventos)
- [ ] Agregar filtro "Solo visibles al cliente" en calendario staff
- [ ] Thumbnails reales en galería de fotos (actualmente usa placeholder)
- [ ] Búsqueda por nombre en documentos
- [ ] Exportar documentos a Excel/PDF con logo corporativo

# Client App - Dovita Core

## Arquitectura

El Client App es una interfaz de solo lectura para clientes que consume vistas SQL específicas que ya filtran por visibilidad y permisos. Adicionalmente, todos los queries en el frontend aplican filtros explícitos por `client_id` o `project_id` como práctica de defensa en profundidad.

## 🔐 Seguridad

### Capas de Seguridad

1. **RLS (Row-Level Security)**: Políticas activas en todas las vistas y buckets
2. **Filtros Explícitos en FE**: Todos los queries filtran por `client_id` o `project_id`
3. **Signed URLs**: Acceso a archivos con URLs firmadas de corta duración (600s)
4. **Validación de Sesión**: Todos los endpoints requieren autenticación

### Principios

- ✅ RLS activo en todas las vistas
- ✅ Filtros explícitos en FE (defensa en profundidad)
- ✅ Signed URLs con expiración corta
- ✅ Sin bypass de admin en código cliente
- ❌ NO usar `getPublicUrl()` en buckets privados
- ❌ NO almacenar URLs completas en DB

## 📊 Vistas Disponibles

| Vista | Propósito | Filtro Principal | Campos Principales |
|-------|-----------|------------------|--------------------|
| `v_client_projects` | Listado de proyectos del cliente | `client_id` | project_id, project_code, project_name, status, created_at |
| `v_client_project_summary` | Resumen ejecutivo del proyecto | `project_id` | total_budget, total_spent, status, construction_progress, next_appointment |
| `v_budget_items_client` | Partidas presupuestales (sin costos internos) | `project_id` | descripción, cantidad, precio_unitario, total |
| `v_client_budget_categories` | Totales por categoría mayor | `project_id` | mayor_code, mayor_name, total_budget, total_spent |
| `v_construction_progress` | Avance de obra por etapa | `project_id` | stage_id, stage_name, progress_percentage, description |
| `v_client_appointments` | Citas programadas del proyecto | `project_id` | title, start_time, end_time, location, status, description |
| `v_client_documents` | Documentos con visibilidad='cliente' | `project_id` | id, nombre, file_url, file_type, file_size, created_at |

## 📁 Storage y RLS

### Buckets Privados

- **`project_docs`**: Documentos generales del proyecto (contratos, planos, etc.)
- **`project_photos`**: Fotos de construcción y avances de obra

Ambos buckets son **privados** (`public = false`) y requieren URLs firmadas para acceso.

### Convención de Paths

Formato: `{project_id}/{YYMM}-{uuid}-{slugified-filename}.ext`

**Ejemplo:**
```
550e8400-e29b-41d4-a716-446655440000/2501-abc123-plano-arquitectonico.pdf
```

**Componentes:**
- `project_id`: UUID del proyecto (permite filtrar por proyecto en RLS)
- `YYMM`: Año (2 dígitos) + Mes (2 dígitos)
- `uuid`: Identificador único del archivo
- `slugified-filename`: Nombre del archivo sanitizado
- `ext`: Extensión original

### Políticas RLS

Las políticas de storage usan `split_part(name, '/', 1)::uuid` para extraer el `project_id` del path y validar contra `get_user_project_ids(auth.uid())`.

**Clientes:**
- **SELECT**: Solo archivos de proyectos a los que tienen acceso
- **INSERT/UPDATE/DELETE**: No permitido directamente

**Staff (admin/colaborador):**
- **ALL**: Acceso completo (CRUD) a todos los archivos

### Función Helper SQL

```sql
public.get_user_project_ids(p_user_id uuid) RETURNS uuid[]
```

Devuelve un array de UUIDs de proyectos a los que el usuario tiene acceso:
- Proyectos donde es colaborador
- Proyectos del cliente (si el email del usuario coincide con el cliente)

### Lectura de Archivos

**SIEMPRE usar signed URLs:**

```typescript
import { getProjectFileUrl } from '@/lib/storage/client-storage-helpers';

// Obtener URL firmada (expira en 600s por defecto)
const { url } = await getProjectFileUrl('project_docs', doc.file_url, 600);

// Abrir en nueva pestaña
window.open(url, '_blank');

// O mostrar en iframe
<iframe src={url} />
```

**❌ NO hacer:**
```typescript
// INCORRECTO - No funciona en buckets privados
const publicUrl = supabase.storage.from('project_docs').getPublicUrl(path);
```

## 🔌 Data Hooks

Todos los hooks siguen el patrón:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

export function useClientExample(projectId: string | null) {
  return useQuery({
    queryKey: ['client-example', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // ✅ Filtro explícito en FE (además de RLS)
      const { data, error } = await supabase
        .from('v_client_view')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}
```

### Hooks Disponibles

| Hook | Archivo | Vista Consumida |
|------|---------|----------------|
| `useClientProjects(clientId)` | `src/hooks/client-app/useClientProjects.ts` | `v_client_projects` |
| `useClientProjectSummary(projectId)` | `src/hooks/client-app/useClientProjectSummary.ts` | `v_client_project_summary` |
| `useClientBudgetItems(projectId)` | `src/hooks/client-app/useClientBudgetItems.ts` | `v_budget_items_client` |
| `useClientBudgetCategories(projectId)` | `src/hooks/client-app/useClientBudgetCategories.ts` | `v_client_budget_categories` |
| `useClientConstructionProgress(projectId)` | `src/hooks/client-app/useClientConstructionProgress.ts` | `v_construction_progress` |
| `useClientAppointments(projectId)` | `src/hooks/client-app/useClientAppointments.ts` | `v_client_appointments` |
| `useClientDocuments(projectId)` | `src/hooks/client-app/useClientDocuments.ts` | `v_client_documents` |

## 🛠️ Storage Helpers

```typescript
import {
  uploadProjectFile,
  uploadProjectPhoto,
  listProjectFiles,
  getProjectFileUrl,
  deleteProjectFile
} from '@/lib/storage/client-storage-helpers';

// Subir documento
const { path } = await uploadProjectFile(projectId, file);

// Subir foto
const { path } = await uploadProjectPhoto(projectId, photoFile);

// Listar archivos de un proyecto
const files = await listProjectFiles('project_docs', projectId);

// Obtener URL firmada (expira en 600s)
const { url } = await getProjectFileUrl('project_docs', path, 600);

// Eliminar archivo (solo staff)
const deleted = await deleteProjectFile('project_docs', path);
```

## 🎨 Componentes UI

### Páginas

- **`ProjectsList.tsx`**: Listado de proyectos del cliente
- **`ProjectDetail.tsx`**: Detalle de proyecto con tabs

### Tabs de Proyecto

- **`ProjectSummaryTab.tsx`**: Resumen ejecutivo (presupuesto, avance, próxima cita)
- **`ProjectBudgetTab.tsx`**: Presupuesto por categorías mayores con progreso
- **`ProjectProgressTab.tsx`**: Avance de obra por etapas (alerta en 80%)
- **`ProjectAppointmentsTab.tsx`**: Citas programadas con detalles
- **`ProjectDocumentsTab.tsx`**: Grid de documentos con preview y descarga

### Características

- **Responsive**: Mobile-first design con grid adaptativo
- **Skeletons**: Indicadores de carga mientras se obtienen los datos
- **Error States**: Mensajes amigables cuando no hay datos
- **Preview Modal**: Vista previa de PDFs e imágenes
- **Signed URLs**: Descarga segura con expiración

## 🚀 Agregar Nueva Sección

1. **Verificar vista existe**: Consultar esquema para `v_client_*`
   ```sql
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'v_client_%';
   ```

2. **Crear hook**: `src/hooks/client-app/use<Nueva>Data.ts`
   ```typescript
   export function useClientNewData(projectId: string | null) {
     return useQuery({
       queryKey: ['client-new-data', projectId],
       queryFn: async () => {
         if (!projectId) return [];
         
         const { data, error } = await supabase
           .from('v_client_new_view')
           .select('*')
           .eq('project_id', projectId);
         
         if (error) throw error;
         return data;
       },
       enabled: !!projectId,
       ...CACHE_CONFIG.active,
     });
   }
   ```

3. **Crear componente tab**: `src/components/client-app/<Nueva>Tab.tsx`
   ```typescript
   import { useClientNewData } from '@/hooks/client-app/useClientNewData';
   
   export default function NewTab({ projectId }: { projectId: string }) {
     const { data, isLoading } = useClientNewData(projectId);
     
     // Implementar UI...
   }
   ```

4. **Agregar a `ProjectDetail.tsx`**: Nueva pestaña en `<Tabs>`
   ```tsx
   <TabsTrigger value="nueva">Nueva Sección</TabsTrigger>
   
   <TabsContent value="nueva">
     <NewTab projectId={id!} />
   </TabsContent>
   ```

## 🧪 Testing

### Test Manual de RLS

```sql
-- 1. Crear usuario de prueba cliente
-- 2. Asignarle un proyecto
-- 3. Verificar que solo vea sus archivos:

SET ROLE authenticated;
SET request.jwt.claim.sub = '<client_user_id>';

SELECT * FROM storage.objects 
WHERE bucket_id = 'project_docs';

-- Debe retornar solo archivos de proyectos del cliente
```

### Checklist de Funcionalidad

- [ ] Cliente puede ver listado de sus proyectos
- [ ] Cliente puede acceder a detalle de proyecto
- [ ] Resumen muestra datos correctos
- [ ] Presupuesto muestra categorías sin datos sensibles
- [ ] Avance muestra etapas con alertas al 80%
- [ ] Citas se muestran ordenadas cronológicamente
- [ ] Documentos se pueden previsualizar y descargar
- [ ] URLs firmadas expiran correctamente
- [ ] Cliente NO puede ver proyectos de otros clientes
- [ ] Skeletons se muestran durante carga
- [ ] Mensajes de "sin datos" funcionan correctamente

## 📋 Rutas

```typescript
// src/config/routes.ts
export const CLIENT_APP_ROUTES = {
  PROJECTS: '/cliente/proyectos',
  PROJECT_DETAIL: '/cliente/proyectos/:id',
} as const;
```

```tsx
// src/App.tsx
<Route 
  path="/cliente/proyectos" 
  element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} 
/>
<Route 
  path="/cliente/proyectos/:id" 
  element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} 
/>
```

## ⚠️ Notas Importantes

### Migración de Paths

- **Nuevo formato**: `{project_id}/{YYMM}-{uuid}-{filename}`
- **Formato legacy**: `{project_id}/{YYYY-MM}/{uuid}-{filename}`
- **Compatibilidad**: Ambos formatos funcionan, no es necesario migrar archivos existentes
- **Nuevos uploads**: Usan el nuevo formato automáticamente

### Defensa en Profundidad

RLS protege a nivel de base de datos, pero siempre agregamos filtros explícitos en el frontend como capa adicional de seguridad.

```typescript
// ✅ CORRECTO
const { data } = await supabase
  .from('v_client_projects')
  .select('*')
  .eq('client_id', clientId);  // Filtro explícito

// ❌ INCORRECTO (confiar solo en RLS)
const { data } = await supabase
  .from('v_client_projects')
  .select('*');
```

### Signed URLs Cortas

URLs firmadas expiran en 600 segundos (10 minutos) por defecto para:
- Evitar compartir links permanentes
- Proteger acceso no autorizado
- Cumplir con mejores prácticas de seguridad

Si el cliente necesita más tiempo, puede regenerar la URL haciendo clic nuevamente.

## 🔗 Referencias

- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Signed URLs](https://supabase.com/docs/guides/storage/security/access-control#authenticated-access)
- [Dovita Storage Conventions](./STORAGE_CONVENTIONS.md)
- [Dovita RLS Policies](./RLS_POLICIES.md)

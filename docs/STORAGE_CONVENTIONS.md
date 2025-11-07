# Storage Conventions - Dovita Core

## 📋 Resumen

Este documento define las convenciones y reglas para el manejo de archivos en Dovita Core usando Supabase Storage.

## 🗂️ Buckets por Módulo

| Bucket | Privacidad | Propósito | Módulos |
|--------|-----------|-----------|---------|
| `documentos` | Privado | Documentos internos, fotos de construcción, adjuntos de presupuesto | Construcción, Presupuestos, Proyectos |
| `project_docs` | Privado | Documentos visibles para clientes | Proyectos, Cliente App |
| `design-deliverables` | Privado | Entregables de diseño por fase | Diseño |
| `cfdi` | Privado | Facturas XML/PDF | Contabilidad, Finanzas |
| `firmas` | Privado | Firmas de wishlists y documentos firmados | CRM, Proyectos |

## 📝 Formato de Ruta Estándar

**Convención obligatoria:**

```
{projectId}/{YYMM}-{uuid}-{slugified-filename}.{ext}
```

**Ejemplo:**
```
550e8400-e29b-41d4-a716-446655440000/2501-a1b2c3d4-presupuesto-ejecutivo.pdf
```

### Componentes de la Ruta

- **`projectId`**: UUID del proyecto (folder raíz)
- **`YYMM`**: Año (2 dígitos) + Mes (2 dígitos) para organización temporal
- **`uuid`**: UUID único generado con `crypto.randomUUID()`
- **`slugified-filename`**: Nombre del archivo en minúsculas, sin acentos, espacios reemplazados por guiones
- **`ext`**: Extensión original del archivo

### Excepciones a la Convención

**CFDI (Facturas):**
```
{emisor_rfc}/{YYMM}-{uuid}-{filename}.xml
```

Ejemplo:
```
ABC123456DEF/2501-a1b2c3d4-factura-001.xml
```

Razón: Agrupa facturas por emisor para facilitar búsquedas y reportes fiscales.

## 🔐 Lectura de Archivos

### Buckets Privados (TODOS)

**❌ INCORRECTO:**
```typescript
const { data } = supabase.storage.from('documentos').getPublicUrl(path);
// NO USAR getPublicUrl() en buckets privados
```

**✅ CORRECTO:**
```typescript
import { getSignedUrl } from '@/lib/storage/storage-helpers';

const { url } = await getSignedUrl({
  bucket: 'documentos',
  path: 'project-id/2501-uuid-file.pdf',
  expiresInSeconds: 600 // 10 minutos por defecto
});
```

### Tiempo de Expiración de URLs Firmadas

| Contexto | Duración Recomendada |
|----------|---------------------|
| Vista previa en UI | 600s (10 min) |
| Descarga directa | 300s (5 min) |
| Galería de fotos | 900s (15 min) |
| PDF viewer | 1800s (30 min) |

## 💾 Almacenamiento en Base de Datos

**❌ INCORRECTO - No almacenar URLs públicas:**
```typescript
const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);
await supabase.from('documents').insert({
  file_url: publicUrl // ❌ NO HACER ESTO
});
```

**✅ CORRECTO - Almacenar solo la ruta:**
```typescript
import { uploadToBucket } from '@/lib/storage/storage-helpers';

const { path } = await uploadToBucket({
  bucket: 'documentos',
  projectId: project.id,
  file: uploadedFile
});

await supabase.from('documents').insert({
  file_url: path, // ✅ Solo la ruta relativa
  project_id: project.id,
  nombre: uploadedFile.name,
  file_type: uploadedFile.type,
  file_size: uploadedFile.size
});
```

## 🚀 Uso de Helpers

### Upload Estándar

```typescript
import { uploadToBucket } from '@/lib/storage/storage-helpers';

try {
  const { path } = await uploadToBucket({
    bucket: 'project_docs',
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    file: fileFromInput,
    filename: 'custom-name.pdf' // Opcional
  });
  
  console.log('File uploaded to:', path);
  // Guardar path en DB
} catch (error) {
  console.error('Upload failed:', error);
}
```

### Generar URL Firmada para Lectura

```typescript
import { getSignedUrl } from '@/lib/storage/storage-helpers';

try {
  const { url } = await getSignedUrl({
    bucket: 'documentos',
    path: document.file_url, // Ruta desde DB
    expiresInSeconds: 600
  });
  
  // Usar url para iframe, img src, o download
  window.open(url, '_blank');
} catch (error) {
  console.error('Failed to get signed URL:', error);
}
```

### Eliminar Archivo

```typescript
import { deleteFromBucket } from '@/lib/storage/storage-helpers';

const success = await deleteFromBucket('documentos', document.file_url);
if (success) {
  // Eliminar registro de DB
  await supabase.from('documents').delete().eq('id', document.id);
}
```

## 🛡️ Seguridad

### ✅ Permitido

- Usar helpers de `storage-helpers.ts` para todas las operaciones
- Almacenar rutas relativas en columnas `file_url`
- Usar `createSignedUrl()` para lectura
- Validar tamaño y tipo de archivo antes de upload
- Eliminar archivos de storage al eliminar registros de DB

### ❌ Prohibido

- **NUNCA** usar `getPublicUrl()` en buckets privados
- **NUNCA** exponer `service_role_key` en frontend
- **NUNCA** almacenar URLs públicas completas en DB
- **NUNCA** usar rutas custom que no sigan la convención `projectId/YYMM-uuid-name.ext`
- **NUNCA** hardcodear nombres de archivos sin slugify

## 📊 Columnas Estándar en Tablas

Todas las tablas que referencian archivos deben incluir:

```sql
CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  file_name TEXT NOT NULL,           -- Nombre original
  file_url TEXT NOT NULL,            -- Ruta relativa en storage
  file_type TEXT,                    -- MIME type
  file_size BIGINT,                  -- Bytes
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔄 Migración de Datos Existentes

Si hay datos con URLs completas en `file_url`, ejecutar migración:

```sql
-- Extraer solo la ruta del final de la URL
UPDATE documents
SET file_url = REGEXP_REPLACE(
  file_url,
  '^https://[^/]+/storage/v1/object/(public|sign)/[^/]+/',
  ''
)
WHERE file_url LIKE 'https://%';

-- Verificar
SELECT file_url FROM documents LIMIT 10;
```

## 📚 Ejemplo Completo: Upload → DB → Read

```typescript
import { uploadToBucket, getSignedUrl } from '@/lib/storage/storage-helpers';
import { supabase } from '@/integrations/supabase/client';

// 1. Upload
async function uploadDocument(projectId: string, file: File) {
  const { path } = await uploadToBucket({
    bucket: 'project_docs',
    projectId,
    file
  });
  
  // 2. Save to DB
  const { data, error } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      nombre: file.name,
      file_url: path, // Solo la ruta
      file_type: file.type,
      file_size: file.size,
      tipo_carpeta: 'general',
      visibilidad: 'cliente'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 3. Read with signed URL
async function viewDocument(document: any) {
  const { url } = await getSignedUrl({
    bucket: 'project_docs',
    path: document.file_url,
    expiresInSeconds: 600
  });
  
  window.open(url, '_blank');
}
```

## 🎯 Checklist de Implementación

Al crear un nuevo feature que maneje archivos:

- [ ] Uso helpers de `storage-helpers.ts`
- [ ] Ruta sigue convención `projectId/YYMM-uuid-name.ext`
- [ ] `file_url` almacena solo ruta, no URL
- [ ] Lectura usa `createSignedUrl()` (buckets privados)
- [ ] Validación de tipo y tamaño de archivo
- [ ] Eliminación de storage al borrar registro
- [ ] Columnas estándar en tabla (file_name, file_url, file_type, file_size)
- [ ] Manejo de errores en upload/delete
- [ ] Toast de éxito/error

## 🔗 Referencias

- **Helpers:** `src/lib/storage/storage-helpers.ts`
- **Buckets:** `src/lib/storage/buckets.ts`
- **Wiring Map:** `audit/wiring-map.json`
- **Supabase Storage Docs:** https://supabase.com/docs/guides/storage

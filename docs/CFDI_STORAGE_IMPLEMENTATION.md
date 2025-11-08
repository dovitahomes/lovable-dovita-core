# Storage Helpers - CFDI Implementation

## Convenciones implementadas

### 1. Subida de XML a Storage

Los archivos CFDI XML se almacenan en el bucket `cfdi` (privado) siguiendo esta convención:

```
emisor_rfc/YYMM-uuid-filename.xml
```

**Ejemplo:**
```
ABC123456DEF/2501-a1b2c3d4-e5f6-7890-abcd-ef1234567890-factura-001.xml
```

### 2. Estructura de la ruta

- **emisor_rfc**: RFC del emisor del comprobante
- **YYMM**: Año y mes en formato de 2 dígitos (ej: 2501 = enero 2025)
- **uuid**: UUID único generado para evitar colisiones
- **filename**: Nombre del archivo XML (típicamente el UUID fiscal del CFDI)

### 3. Almacenamiento en la base de datos

La tabla `invoices` almacena en el campo `xml_url` **solo la ruta relativa**, no la URL completa:

```sql
xml_url: "ABC123456DEF/2501-a1b2c3d4-e5f6-7890-abcd-ef1234567890-factura-001.xml"
```

**NO** se almacena:
```
❌ https://xxx.supabase.co/storage/v1/object/public/cfdi/ABC123456DEF/...
```

### 4. Lectura y descarga segura

Para acceder al XML, se genera una **signed URL** con expiración de 600 segundos (10 minutos):

```typescript
import { getCfdiSignedUrl } from "@/lib/storage/storage-helpers";

// Obtener URL temporal para descargar/visualizar
const { url } = await getCfdiSignedUrl(invoice.xml_url);
window.open(url, '_blank');
```

**Beneficios de usar signed URLs:**
- ✅ Seguridad: URLs temporales que expiran automáticamente
- ✅ Control de acceso: Solo usuarios autorizados pueden generar las URLs
- ✅ No expone el service role key
- ✅ Auditoría: Todas las solicitudes pasan por el cliente autenticado

### 5. Helpers disponibles

#### `toYYMM(date: Date): string`
Convierte una fecha a formato YYMM.

```typescript
toYYMM(new Date('2025-01-15')) // "2501"
toYYMM(new Date('2024-12-31')) // "2412"
```

#### `buildCfdiPath(params): string`
Construye la ruta completa según las convenciones CFDI.

```typescript
buildCfdiPath({
  scope: 'ABC123456DEF',
  yymm: '2501',
  uuid: '12345678-abcd-1234-abcd-1234567890ab',
  filename: 'A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6.xml'
})
// → "ABC123456DEF/2501-12345678-abcd-1234-abcd-1234567890ab-A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6.xml"
```

#### `uploadCfdiXml(emisorRfc, file, filename?): Promise<{ path: string }>`
Sube un archivo XML al bucket cfdi siguiendo las convenciones.

```typescript
const { path } = await uploadCfdiXml(
  'ABC123456DEF',
  xmlFile,
  'A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6.xml'
);
// Retorna: { path: "ABC123456DEF/2501-..." }
```

#### `getCfdiSignedUrl(xmlPath, expiresInSeconds?): Promise<{ url: string }>`
Genera una URL firmada temporal para acceder al XML.

```typescript
const { url } = await getCfdiSignedUrl(
  'ABC123456DEF/2501-...',
  600 // Opcional, default 600s
);
// Retorna: { url: "https://xxx.supabase.co/storage/v1/object/sign/cfdi/ABC123456DEF/...?token=..." }
```

## Flujo completo

### Subida de CFDI

```typescript
// 1. Parsear XML
const cfdi = parseCfdiXml(xmlContent);

// 2. Subir a Storage
const { path } = await uploadCfdiXml(
  cfdi.emisor.rfc,
  file,
  `${cfdi.timbre.uuid}.xml`
);

// 3. Guardar en DB (solo la ruta relativa)
await supabase.from('invoices').insert({
  uuid: cfdi.timbre.uuid,
  xml_url: path, // Ruta relativa
  // ... otros campos
});
```

### Visualización/descarga de CFDI

```typescript
// 1. Obtener invoice de la DB
const { data: invoice } = await supabase
  .from('invoices')
  .select('xml_url')
  .eq('id', invoiceId)
  .single();

// 2. Generar signed URL
const { url } = await getCfdiSignedUrl(invoice.xml_url);

// 3. Abrir en nueva ventana
window.open(url, '_blank');
```

## Validación de implementación

✅ **Checklist de cumplimiento:**

- [x] `invoices.xml_url` almacena ruta relativa (no URL completa)
- [x] Bucket `cfdi` es privado
- [x] Convención de ruta: `emisor_rfc/YYMM-uuid-filename.xml`
- [x] Vista/descarga usa `createSignedUrl` con expiración de 600s
- [x] Helpers en `src/lib/storage/storage-helpers.ts`:
  - `toYYMM()`
  - `buildCfdiPath()`
  - `uploadCfdiXml()`
  - `getCfdiSignedUrl()`
- [x] No se usa `getPublicUrl()` para buckets privados
- [x] `CfdiUploadDialog` implementado siguiendo convenciones
- [x] `InvoicesTab` usa signed URLs para acceso

## Reusabilidad

Estos helpers están diseñados para reutilizarse en:

- ✅ **CFDI** (actual)
- 📄 **DocumentManager** (futuro)
- 📸 **Photos/ConstructionPhotos** (futuro)
- 💰 **Budget attachments** (futuro)

Todas las funciones están centralizadas en `src/lib/storage/storage-helpers.ts` para facilitar el mantenimiento y la consistencia.

## Testing manual

```bash
# 1. Subir un CFDI XML
# Ir a Contabilidad > Facturas > "Subir CFDI"
# Seleccionar archivo XML válido

# 2. Verificar en Supabase Storage
# Bucket: cfdi
# Ruta: ABC123456DEF/2501-{uuid}-{filename}.xml

# 3. Verificar en DB
# SELECT xml_url FROM invoices WHERE uuid = '{cfdi_uuid}';
# Debe retornar: "ABC123456DEF/2501-..."

# 4. Descargar/visualizar XML
# En lista de facturas, click en botón Download
# Debe abrir nueva ventana con signed URL temporal
```

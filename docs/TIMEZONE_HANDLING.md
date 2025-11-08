# Manejo de Zona Horaria en Dovita Core

## Regla de Oro

**TODA la plataforma trabaja en la zona horaria de Ciudad de México (`America/Mexico_City`).**

## Tipos de Fechas

### 1. Date-Only (sin hora)
- Ejemplos: `fecha_nacimiento`, `fecha_ingreso`
- Formato DB: `YYYY-MM-DD` (ej. `"1990-06-18"`)
- Helper: `formatDateOnly()`
- **Nunca** usar `new Date(dateString)` directamente

### 2. Timestamps (con hora)
- Ejemplos: `created_at`, `start_at`, `end_at` de eventos/citas
- Formato DB: ISO 8601 UTC (ej. `"2025-11-08T20:00:00.000Z"`)
- Helpers: `formatDateTime()`, `toUTCFromMexico()`, `fromUTCToMexico()`

## Helpers Disponibles

### `formatDateOnly(dateString, format?)`
Formatea fechas sin hora. No aplica timezone shifts.

```typescript
formatDateOnly("1990-06-18", "dd MMM yyyy") // "18 jun 1990"
```

### `formatDateTime(isoString, format?)`
Formatea timestamps en hora de CDMX.

```typescript
formatDateTime("2025-11-08T20:00:00Z") // "08 nov 2025 14:00" (2PM CDMX)
```

### `toUTCFromMexico(localDateTime)`
Convierte hora local de México a UTC para guardar en DB.

```typescript
// Usuario escoge "08 Nov 2025 14:00" en datetime-local
toUTCFromMexico("2025-11-08T14:00") // "2025-11-08T20:00:00.000Z"
```

### `fromUTCToMexico(isoString)`
Convierte UTC a hora local de México para prellenar inputs.

```typescript
// DB tiene "2025-11-08T20:00:00Z"
fromUTCToMexico("2025-11-08T20:00:00Z") // "2025-11-08T14:00"
```

### `nowInMexico()`
Obtiene fecha/hora actual en CDMX.

### `isSameDayInMexico(date1, date2)`
Compara si dos fechas son el mismo día en CDMX.

## Casos de Uso

### ✅ Mostrar cumpleaños
```typescript
<span>{formatDateOnly(user.fecha_nacimiento, 'dd MMM')}</span>
```

### ✅ Mostrar evento en calendario
```typescript
<p>{formatDateTime(event.start_at, 'dd MMM • HH:mm')}</p>
```

### ✅ Guardar evento desde input datetime-local
```typescript
const utc = toUTCFromMexico(formData.start_at);
await supabase.from('calendar_events').insert({ start_at: utc });
```

### ✅ Editar evento (prellenar input)
```typescript
const localTime = fromUTCToMexico(event.start_at);
setFormData({ start_at: localTime });
```

### ❌ NUNCA hacer esto
```typescript
// MAL: interpretación inconsistente
new Date(user.fecha_nacimiento)

// MAL: no especifica timezone
format(new Date(event.start_at), 'HH:mm')

// MAL: guardar sin convertir de CDMX a UTC
new Date(formData.datetime).toISOString()
```

## Separación Client App

**IMPORTANTE:** La lógica de timezone aplica a toda la plataforma, pero los componentes de client-app (`src/components/client-app/`, `src/pages/client-app/`) NO deben ser modificados por el backoffice.

Los helpers de `src/lib/datetime.ts` pueden ser usados en client-app cuando se necesite, pero cualquier cambio en esos componentes debe ser solicitado explícitamente.

## Testing

Verificar en diferentes zonas horarias del navegador:
- América/CDMX (UTC-6)
- UTC+0 (Londres)
- Asia/Tokyo (UTC+9)

Las fechas y horas deben mostrarse consistentemente en hora de CDMX.

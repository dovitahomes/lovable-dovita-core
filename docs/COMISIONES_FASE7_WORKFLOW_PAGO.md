# Fase 7: Workflow de Pago y Comprobantes

## 📋 Resumen

Se implementó un sistema completo de gestión de pagos de comisiones con upload de comprobantes, validaciones bancarias, export masivo Excel/PDF, y timeline histórico de pagos.

## 🎯 Objetivos Completados

### 1. Storage Bucket para Comprobantes
- ✅ Creado bucket `commission_receipts` (privado)
- ✅ RLS policies:
  - **SELECT**: Admin y usuarios con permiso 'comisiones' view
  - **INSERT**: Admin y usuarios con permiso 'comisiones' create
  - **DELETE**: Solo admin
- ✅ Estructura de carpetas: `{tipo}/{commission_id}_{timestamp}.{ext}`

### 2. Columnas en BD
Agregadas a tabla `commissions`:
- `payment_date` (DATE) - Fecha del pago
- `payment_method` (TEXT) - Método de pago
- `payment_reference` (TEXT) - Referencia bancaria
- `receipt_url` (TEXT) - URL del comprobante en storage

### 3. Dialog "Marcar como Pagada"
**Componente:** `PaymentDialog.tsx`

**Características:**
- ✅ Display prominente del monto a pagar
- ✅ Fecha de pago (date picker, default: hoy)
- ✅ Método de pago (dropdown):
  - Transferencia Bancaria
  - Cheque
  - Efectivo
  - SPEI
  - Otro
- ✅ Referencia bancaria (opcional, max 50 chars)
- ✅ Upload de comprobante (opcional):
  - Formatos: PDF, JPG, PNG
  - Tamaño máximo: 10MB
  - Validación client-side
- ✅ Al confirmar:
  - Upload de comprobante a `commission_receipts`
  - Update de comisión con status='pagada', paid_at, payment_date, payment_method, payment_reference, receipt_url
  - Toast de confirmación

### 4. Export Masivo Excel/PDF
**Archivo:** `src/utils/exports/commissionExports.ts`

#### Export Excel
**3 sheets:**
1. **Resumen**: Desglose por tipo (Alianzas vs Colaboradores)
   - Total Comisiones
   - Monto Total
   - Pendiente
   - Pagado

2. **Detalle**: Todas las comisiones con:
   - Tipo, Sujeto, Cliente, Proyecto
   - Base, %, Comisión
   - Estado, Fecha Generación, Fecha Pago
   - Método Pago, Referencia

3. **Por Alianza**: Agrupado por alianza
   - Nombre alianza
   - # Comisiones
   - Monto Total, Pendiente, Pagado

#### Export PDF
- Header con título "Reporte de Comisiones"
- Información de filtros aplicados
- Fecha de generación
- Tabla resumen con totales
- Tabla detallada con todas las comisiones
- Formato profesional usando jsPDF-autotable

### 5. Timeline de Pagos Históricos
**Componente:** `PaymentTimeline.tsx`

**Características:**
- ✅ Filtros de período:
  - Este Mes
  - Mes Anterior
  - Últimos 3 Meses
  - Últimos 6 Meses
- ✅ Cards de pago mostrando:
  - Monto pagado
  - Cliente y Proyecto
  - Badge de tipo (Alianza/Colaborador)
  - Fecha de pago
  - Método de pago
  - Referencia bancaria
  - Botón para descargar comprobante (si existe)
- ✅ Estado vacío cuando no hay pagos
- ✅ Orden descendente por fecha de pago

### 6. Integración en ComisionesAlianzas
- ✅ Botones "Marcar como Pagada" en cada comisión pendiente
- ✅ Botones "Excel" y "PDF" para export masivo
- ✅ Tab "Historial de Pagos" con `PaymentTimeline`
- ✅ Tabs: "Comisiones" (tabla) | "Historial de Pagos" (timeline)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                 WORKFLOW DE PAGO                        │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Payment │    │ Upload  │    │ Update  │
    │ Dialog  │───▶│ Receipt │───▶│Commission│
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
         │          Storage          Database
         │       commission_        commissions
         │        receipts           table
         │
         └──▶ Toast Confirmation
```

## 📊 Flujo Completo

### Marcar como Pagada
1. Usuario hace clic en "Marcar como Pagada" en comisión pendiente
2. Se abre `PaymentDialog` con monto destacado
3. Usuario completa:
   - Fecha de pago (default: hoy)
   - Método de pago (dropdown)
   - Referencia bancaria (opcional)
   - Comprobante PDF/imagen (opcional)
4. Validaciones:
   - Fecha no vacía
   - Método seleccionado
   - Si hay archivo: formato válido y <10MB
5. Al confirmar:
   - Upload de comprobante a `commission_receipts/{tipo}/{id}_{timestamp}.{ext}`
   - Update en BD:
     ```sql
     UPDATE commissions SET
       status = 'pagada',
       paid_at = NOW(),
       payment_date = :date,
       payment_method = :method,
       payment_reference = :ref,
       receipt_url = :url
     WHERE id = :commission_id
     ```
   - Toast: "Comisión marcada como pagada correctamente"
   - Cierre de dialog
   - Refresh de lista

### Export Excel/PDF
1. Usuario hace clic en botón "Excel" o "PDF"
2. Sistema recopila datos de todas las comisiones visibles (con filtros aplicados)
3. Genera archivo con estructura:
   - **Excel**: 3 sheets (Resumen, Detalle, Por Alianza)
   - **PDF**: Header + Resumen + Detalle
4. Descarga automática con nombre `comisiones_YYYY-MM-DD.{xlsx|pdf}`
5. Toast de confirmación

### Timeline de Pagos
1. Usuario hace clic en tab "Historial de Pagos"
2. Sistema carga comisiones con `status = 'pagada'` en período seleccionado
3. Muestra cards con:
   - Ícono verde de DollarSign
   - Monto destacado
   - Cliente - Proyecto
   - Badge de tipo
   - Fecha, método, referencia
   - Botón "Comprobante" si existe receipt_url
4. Al hacer clic en "Comprobante":
   - Genera signed URL del archivo en storage
   - Abre en nueva pestaña para visualización/descarga

## 🧪 Testing Checklist

### Storage Bucket
- [ ] Bucket `commission_receipts` existe y es privado
- [ ] RLS policy SELECT permite a admin y comisiones view
- [ ] RLS policy INSERT permite a admin y comisiones create
- [ ] RLS policy DELETE permite solo a admin
- [ ] Archivos se suben con estructura correcta `{tipo}/{id}_{timestamp}.{ext}`

### PaymentDialog
- [ ] Se abre al hacer clic en "Marcar como Pagada"
- [ ] Muestra monto correcto de la comisión
- [ ] Fecha de pago default es hoy
- [ ] Dropdown de método de pago funciona
- [ ] Input de referencia acepta texto (max 50 chars)
- [ ] Input de archivo acepta PDF/JPG/PNG
- [ ] Rechaza archivos >10MB con toast error
- [ ] Rechaza formatos no permitidos con toast error
- [ ] Muestra checkmark verde al seleccionar archivo
- [ ] Botón "Confirmar Pago" disabled durante loading
- [ ] Al confirmar:
  - [ ] Comprobante se sube a storage correctamente
  - [ ] Comisión se actualiza en BD con todos los campos
  - [ ] Status cambia a 'pagada'
  - [ ] paid_at se registra
  - [ ] Toast de éxito aparece
  - [ ] Dialog se cierra
  - [ ] Lista se refresca automáticamente

### Export Excel
- [ ] Botón "Excel" visible en vista de alianza
- [ ] Al hacer clic genera archivo `.xlsx`
- [ ] Sheet "Resumen" con totales por tipo
- [ ] Sheet "Detalle" con todas las comisiones
- [ ] Sheet "Por Alianza" con agrupación
- [ ] Nombre de archivo: `comisiones_YYYY-MM-DD.xlsx`
- [ ] Toast de éxito al exportar
- [ ] Muestra error si no hay datos

### Export PDF
- [ ] Botón "PDF" visible en vista de alianza
- [ ] Al hacer clic genera archivo `.pdf`
- [ ] Header con título y fecha
- [ ] Filtros aplicados mostrados
- [ ] Tabla resumen con totales
- [ ] Tabla detalle con todas las comisiones
- [ ] Nombre de archivo: `comisiones_YYYY-MM-DD.pdf`
- [ ] Toast de éxito al exportar
- [ ] Muestra error si no hay datos

### PaymentTimeline
- [ ] Tab "Historial de Pagos" visible
- [ ] Selector de período funciona
- [ ] Muestra solo comisiones pagadas en período
- [ ] Cards ordenadas por fecha descendente
- [ ] Cada card muestra:
  - [ ] Ícono verde de DollarSign
  - [ ] Monto correcto formateado
  - [ ] Cliente y proyecto correctos
  - [ ] Badge de tipo correcto
  - [ ] Fecha de pago formateada
  - [ ] Método de pago traducido
  - [ ] Referencia bancaria si existe
  - [ ] Botón "Comprobante" solo si existe receipt_url
- [ ] Al hacer clic en "Comprobante":
  - [ ] Genera signed URL correctamente
  - [ ] Abre en nueva pestaña
  - [ ] Archivo se visualiza/descarga correctamente
- [ ] Estado vacío cuando no hay pagos

### Integración
- [ ] Botón "Marcar como Pagada" solo en comisiones no pagadas
- [ ] Botones Excel/PDF funcionan desde vista de alianza
- [ ] Tabs "Comisiones" y "Historial de Pagos" cambian correctamente
- [ ] Datos se refrescan al cambiar tabs
- [ ] Timeline filtra por alianza específica cuando aplica

### Responsive
- [ ] PaymentDialog responsive en mobile
- [ ] PaymentTimeline cards responsive
- [ ] Botones de export adaptativos
- [ ] Tabs adaptativos en mobile

### Dark Mode
- [ ] PaymentDialog contraste correcto
- [ ] PaymentTimeline cards legibles
- [ ] Botones y badges visibles
- [ ] Tablas y listas con buen contraste

## 📝 Notas Técnicas

### Seguridad
- Bucket privado: archivos accesibles solo con signed URLs
- RLS policies verifican permisos antes de operaciones
- Validaciones client-side + server-side

### Performance
- Índice en `payment_date` optimiza queries de timeline
- Signed URLs con expiración de 1 hora
- Paginación en queries (limit implícito en filtros de período)

### Mantenibilidad
- Funciones de export centralizadas en `commissionExports.ts`
- Componentes reutilizables (`PaymentDialog`, `PaymentTimeline`)
- Validaciones de archivos extraíbles a utility si se usan en otros módulos

## 🔄 Próximos Pasos

**Fase 8: Mobile Responsive & Dark Mode** (1.5h estimadas)
- Verificación exhaustiva de adaptación móvil en todos los viewports
- Refinamiento de dark mode en todos los componentes de comisiones
- Testing completo de responsive sin scroll horizontal

---

**Fase 7 completada al 100%** ✅

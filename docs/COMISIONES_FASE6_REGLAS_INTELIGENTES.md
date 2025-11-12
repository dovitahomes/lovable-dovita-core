# Fase 6: Sistema de Reglas Inteligentes de Comisiones

## 📋 Resumen

Se implementó un sistema de reglas de comisiones con **matching automático inteligente** que prioriza reglas específicas sobre globales, permitiendo excepciones por alianza mientras mantiene reglas generales como fallback.

## 🎯 Objetivos Completados

### 1. Base de Datos
- ✅ Agregada columna `alianza_id` (UUID nullable FK → alianzas) a `commission_rules`
- ✅ Creado índice `idx_commission_rules_alianza` para performance
- ✅ Actualizada RLS policy para permitir ver reglas de alianzas específicas

### 2. Lógica de Matching Automático
Creado `src/lib/commissions/matchCommissionRule.ts` con función `matchCommissionRule()` que prioriza:

**Prioridad 1:** Regla específica de alianza + tipo proyecto + producto
**Prioridad 2:** Regla específica de alianza + tipo proyecto
**Prioridad 3:** Regla global + tipo proyecto + producto
**Prioridad 4:** Regla global + tipo proyecto
**Prioridad 5:** Fallback a `alianzas.comision_porcentaje`

```typescript
const result = await matchCommissionRule({
  alianzaId: "uuid-alianza",
  projectType: "arquitectura",
  product: "casa-habitacion"
});
// returns: { rule: CommissionRule | null, percent: number | null }
```

### 3. Interfaz de Usuario

#### CommissionRulesTab.tsx
- ✅ Agregado selector "Aplicar solo a" con dropdown de alianzas o "Todas"
- ✅ Badges visuales indicando alcance:
  - 🌐 **Global** (regla aplica a todas las alianzas)
  - 🏢 **Alianza específica** (regla solo aplica a alianza seleccionada)
- ✅ Descripción de scope usando `getRuleScopeDescription()`
- ✅ Columna "Alcance" en tabla mostrando badge + descripción

#### Nuevo Hook
- ✅ `useAlianzas.ts` - Hook para cargar alianzas activas en selectores

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    MATCHING AUTOMÁTICO                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ALIANZA ESPECÍFICA              GLOBAL
         (alianza_id != NULL)       (alianza_id = NULL)
                │                           │
        ┌───────┴───────┐           ┌───────┴───────┐
        │               │           │               │
    Tipo + Prod      Tipo       Tipo + Prod      Tipo
                                                    │
                                            ┌───────┴───────┐
                                            │    FALLBACK   │
                                            │ alianzas.%    │
                                            └───────────────┘
```

## 📊 Ejemplo de Uso

### Escenario: Alianza "Inmobiliaria XYZ"

**Reglas definidas:**
1. Global: Arquitectura → 3%
2. Global: Construcción → 2%
3. Inmobiliaria XYZ: Arquitectura → 5% (específica)
4. Inmobiliaria XYZ: Construcción + Casa Habitación → 7% (muy específica)

**Resultados del matching:**

| Parámetros | Regla Usada | % |
|------------|-------------|---|
| Inmobiliaria XYZ + Arquitectura | #3 (específica de alianza) | 5% |
| Inmobiliaria XYZ + Construcción + Casa | #4 (muy específica) | 7% |
| Inmobiliaria XYZ + Construcción + Comercial | #2 (global, no hay específica) | 2% |
| Otra Alianza + Arquitectura | #1 (global) | 3% |
| Alianza sin reglas | Fallback a `comision_porcentaje` | X% |

## 🧪 Testing Checklist

### Base de Datos
- [ ] Columna `alianza_id` existe en `commission_rules`
- [ ] FK constraint a `alianzas(id)` funciona
- [ ] ON DELETE CASCADE elimina reglas al borrar alianza
- [ ] Índice `idx_commission_rules_alianza` mejora queries

### Lógica de Matching
- [ ] Prioridad 1: alianza + tipo + producto
- [ ] Prioridad 2: alianza + tipo
- [ ] Prioridad 3: global + tipo + producto
- [ ] Prioridad 4: global + tipo
- [ ] Prioridad 5: fallback a alianza.comision_porcentaje
- [ ] Retorna `null` si no hay matches ni fallback

### UI - Crear/Editar Regla
- [ ] Selector "Aplicar solo a" visible
- [ ] Opción "Todas las Alianzas (Global)" con ícono 🌐
- [ ] Alianzas activas listadas con ícono 🏢
- [ ] Helper text explica funcionalidad
- [ ] Al crear regla global: `alianza_id = NULL`
- [ ] Al crear regla específica: `alianza_id = uuid`

### UI - Tabla de Reglas
- [ ] Columna "Alcance" muestra badges correctos
- [ ] Badge "Global" con ícono Globe para reglas generales
- [ ] Badge con nombre de alianza para reglas específicas
- [ ] Descripción de scope debajo del badge
- [ ] Al editar regla, selector pre-selecciona alianza correcta

### Integración
- [ ] Reglas globales existentes siguen funcionando
- [ ] Nuevas reglas específicas se guardan correctamente
- [ ] Editar regla global a específica funciona
- [ ] Editar regla específica a global funciona
- [ ] Eliminar alianza elimina sus reglas (CASCADE)

### Responsive
- [ ] Tabla responsiva en mobile/tablet
- [ ] Selector de alianzas funciona en mobile
- [ ] Badges legibles en pantallas pequeñas

### Dark Mode
- [ ] Badges de alcance tienen buen contraste
- [ ] Descripción de scope es legible
- [ ] Selector de alianzas tiene buen contraste

## 🔄 Próximos Pasos

**Fase 7: Workflow de Pago y Comprobantes** (2h estimadas)
- Dialog "Marcar como pagada"
- Upload de comprobantes a bucket `commission_receipts`
- Export masivo Excel/PDF

**Fase 8: Mobile Responsive & Dark Mode** (1.5h estimadas)
- Verificación exhaustiva de responsive en todos los viewports
- Refinamiento de dark mode en todos los componentes

## 📝 Notas Técnicas

- **Performance:** Índice en `alianza_id` optimiza queries de matching
- **Seguridad:** RLS policies permiten ver reglas solo con permiso 'comisiones'
- **Flexibilidad:** Arquitectura soporta N niveles de especificidad futuros
- **Mantenibilidad:** Función `getRuleScopeDescription()` centraliza lógica de descripción

---

**Fase 6 completada al 100%** ✅

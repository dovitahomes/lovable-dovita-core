# Limpiar Caché de Rutas - Dovita Core

## 🎯 Propósito

Esta guía te ayuda a eliminar rutas "fantasma" que aparecen en el autocompletado del navegador pero que ya no existen en el código.

---

## 🔍 ¿Por Qué Aparecen Rutas Fantasma?

Las rutas fantasma pueden aparecer por varias razones:

1. **Caché del Navegador**: Chrome/Edge/Firefox guardan URLs visitadas históricamente
2. **React Router DevTools**: El router infiere rutas de componentes antiguos
3. **localStorage**: Rutas guardadas en sesiones anteriores
4. **Historial de Navegación**: URLs almacenadas en el historial del navegador

---

## 🧹 Métodos de Limpieza

### Método 1: Limpieza Rápida (Recomendado)

**Chrome/Edge**:
1. Presiona `Ctrl + Shift + Delete` (Windows/Linux) o `Cmd + Shift + Delete` (Mac)
2. Selecciona "Todo el tiempo" en el rango de tiempo
3. Marca solo estas opciones:
   - ✅ Historial de navegación
   - ✅ Imágenes y archivos en caché
   - ✅ Cookies y otros datos de sitios
4. Click en "Borrar datos"

**Firefox**:
1. Presiona `Ctrl + Shift + Delete`
2. Selecciona "Todo"
3. Marca:
   - ✅ Historial de navegación y descargas
   - ✅ Caché
   - ✅ Cookies
4. Click en "Limpiar ahora"

---

### Método 2: Limpieza por Consola del Navegador

1. Abre DevTools (`F12`)
2. Ve a la pestaña **Console**
3. Ejecuta los siguientes comandos:

```javascript
// Limpiar localStorage
localStorage.clear();

// Limpiar sessionStorage
sessionStorage.clear();

// Confirmar limpieza
console.log('✅ Storage limpiado');
```

4. Recarga la página con `Ctrl + Shift + R` (hard refresh)

---

### Método 3: Limpieza Desde Application Tab

1. Abre DevTools (`F12`)
2. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
3. En el menú izquierdo:
   - Expande **Local Storage** → Click derecho → "Clear"
   - Expande **Session Storage** → Click derecho → "Clear"
   - Click en **Clear site data** (Chrome) o **Clear All** (Firefox)
4. Recarga con `Ctrl + Shift + R`

---

### Método 4: Modo Incógnito (Testing Temporal)

Para verificar sin afectar tu sesión actual:

1. Abre ventana de incógnito: `Ctrl + Shift + N` (Chrome) o `Ctrl + Shift + P` (Firefox)
2. Navega a `http://localhost:8080` (o tu URL local)
3. Verifica que solo aparezcan las rutas correctas

**Nota**: Este método NO limpia el caché permanentemente, solo te permite verificar sin interferencia.

---

## ✅ Verificación Post-Limpieza

Después de limpiar, verifica que el autocompletado muestre **SOLO** estas rutas:

### Rutas Públicas ✓
- `/auth/login`
- `/auth/callback`
- `/auth/reset`
- `/debug` (solo desarrollo)

### Rutas Client App ✓
- `/client`
- `/client/dashboard`
- `/client/photos`
- `/client/financial`
- `/client/chat`
- `/client/documents`
- `/client/schedule`
- `/client/appointments`
- `/client/settings`

### Rutas Backoffice ✓
- `/` (dashboard)
- `/leads`
- `/clientes`
- `/clientes/:id`
- `/proyectos`
- `/proyectos/:id`
- `/diseno`
- `/presupuestos`
- `/gantt`
- `/construccion`
- `/ordenes-compra`
- `/proveedores`
- `/contabilidad`
- `/lotes-pago`
- `/comisiones`
- `/ver-como-cliente`
- `/herramientas/*`

---

## ❌ Rutas que YA NO EXISTEN (Fantasmas Comunes)

Si ves estas rutas en el autocompletado, es evidencia de caché antiguo:

- `/cronograma` ❌ (ahora es `/gantt`)
- `/cronograma-parametrico` ❌ (ahora es `/gantt`)
- `/finanzas` ❌ (ahora es `/contabilidad`)
- `/client/:clientId` ❌ (fue reemplazado por selector de proyecto)
- `/signup` ❌ (redirige a `/auth/login`)

---

## 🔧 Troubleshooting

### Problema: "Aún veo rutas antiguas después de limpiar"

**Solución**:
1. Cierra completamente el navegador (no solo la pestaña)
2. Reabre el navegador
3. Presiona `Ctrl + Shift + R` para hard refresh
4. Si persiste, prueba en modo incógnito

### Problema: "La app no carga después de limpiar"

**Solución**:
1. Esto es normal si estabas autenticado
2. Vuelve a hacer login en `/auth/login`
3. Tu sesión se restaurará automáticamente

### Problema: "El autocompletado sigue sugiriendo rutas incorrectas"

**Solución**:
1. El navegador puede tardar en actualizar el índice de URLs
2. Usa el método "Limpieza por Consola" + hard refresh
3. Espera ~5 minutos para que el navegador reindexe
4. Si persiste, considera borrar el historial completo del navegador

---

## 🚀 Recomendaciones de Desarrollo

Para evitar acumulación de rutas fantasma:

1. **Usar modo incógnito** para testing de features nuevas
2. **Limpiar caché semanalmente** durante desarrollo activo
3. **No usar URLs directas** en navegación (siempre usar constantes de `routes.ts`)
4. **Documentar cambios de rutas** en `docs/ROUTES_ARCHITECTURE.md`

---

## 📚 Referencias

- [Documentación de Rutas](./ROUTES_ARCHITECTURE.md)
- [Configuración de Rutas](../src/config/routes.ts)
- [Validación de Rutas Dev Tool](../src/dev/routeHealth.tsx)

---

**Última actualización**: 2025-11-06  
**Versión**: 1.0.0

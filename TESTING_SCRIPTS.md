# 🧪 Scripts de Testing - Instrucciones de Instalación

## ⚠️ ACCIÓN REQUERIDA

Los scripts de testing **NO** pueden ser agregados automáticamente al `package.json` por limitaciones de seguridad.

**Por favor, agrega manualmente los siguientes scripts a tu `package.json`:**

## 📋 Scripts a Agregar

Abre tu archivo `package.json` y agrega estos scripts en la sección `"scripts"`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Ejemplo Completo

Tu sección de scripts debería verse así:

```json
{
  "name": "dovita-core",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## 🚀 Uso de Scripts

Una vez agregados los scripts, podrás usarlos:

### 1. Ejecutar Tests
```bash
npm run test
```
Ejecuta todos los tests una vez y muestra resultados.

### 2. Modo Watch (Desarrollo)
```bash
npm run test:watch
```
Re-ejecuta automáticamente los tests cuando guardas cambios en archivos.

### 3. Reporte de Cobertura
```bash
npm run test:coverage
```
Genera reporte completo de cobertura de código en `coverage/index.html`.

### 4. UI Interactiva
```bash
npm run test:ui
```
Abre interfaz gráfica interactiva de Vitest en el navegador.

## ✅ Verificación

Para verificar que los scripts funcionan correctamente:

1. **Agrega los scripts al package.json**
2. **Ejecuta:**
   ```bash
   npm run test
   ```
3. **Deberías ver:**
   ```
   ✓ src/components/client-app/__tests__/DovitaHeader.test.tsx (7)
   ✓ src/components/client-app/__tests__/InteractiveMenu.test.tsx (8)
   ✓ src/components/client-app/__tests__/NotificationPanel.test.tsx (7)
   ✓ src/components/client-app/__tests__/GlobalSearch.test.tsx (6)
   ✓ src/pages/client-app/__tests__/Dashboard.test.tsx (5)
   ✓ src/pages/client-app/__tests__/Photos.test.tsx (4)
   ✓ src/pages/client-app/__tests__/Financial.test.tsx (5)
   ✓ src/pages/client-app/__tests__/Chat.test.tsx (6)
   ✓ src/pages/client-app/__tests__/Appointments.test.tsx (5)
   ✓ src/pages/client-app/__tests__/Settings.test.tsx (6)

   Test Files  10 passed (10)
        Tests  59 passed (59)
   ```

## 🎯 Objetivos de Cobertura

Con `npm run test:coverage`, verifica que se cumplan estos umbrales:

- **Lines:** ≥ 80%
- **Functions:** ≥ 80%
- **Branches:** ≥ 80%
- **Statements:** ≥ 80%

El build fallará si no se alcanzan estos porcentajes.

## 📚 Documentación Completa

Para más detalles sobre testing, consulta:
- **[docs/TESTING_SETUP.md](./docs/TESTING_SETUP.md)** - Guía completa de testing
- **[vitest.config.ts](./vitest.config.ts)** - Configuración de Vitest
- **[src/test/setup.ts](./src/test/setup.ts)** - Setup global de tests

---

**Fecha:** 2025-01-10
**Estado:** ⏳ Pendiente de configuración manual

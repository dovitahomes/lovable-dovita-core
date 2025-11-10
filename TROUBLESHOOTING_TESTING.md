# 🔧 Troubleshooting: Testing Setup

## ⚠️ Error de TypeScript: "Module has no exported member 'screen' / 'waitFor'"

Si ves errores como:
```
error TS2305: Module '"@/test/test-utils"' has no exported member 'screen'.
error TS2305: Module '"@/test/test-utils"' has no exported member 'waitFor'.
```

### Causa del Problema

Este error ocurre por incompatibilidad de versiones entre las librerías de testing o configuración de tipos en TypeScript.

### ✅ Solución Implementada

Hemos implementado múltiples soluciones:

1. **Archivo de tipos personalizado**: `src/test/test-utils.d.ts`
2. **Importación desde @testing-library/dom**: Los tipos se importan correctamente
3. **Re-exportación explícita**: screen y waitFor se exportan desde test-utils

### 🔍 Verificación

1. **Reinicia el servidor de TypeScript:**
   - En VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
   
2. **Limpia la caché de TypeScript:**
   ```bash
   rm -rf node_modules/.cache
   npm run dev
   ```

3. **Verifica las instalaciones:**
   ```bash
   npm list @testing-library/react
   npm list @testing-library/dom
   npm list @testing-library/jest-dom
   ```

### 🛠️ Si el Error Persiste

#### Opción 1: Importar Directamente desde @testing-library

Modifica tus tests para importar screen/waitFor desde diferentes fuentes:

```typescript
// En lugar de:
import { render, screen, waitFor } from '@/test/test-utils';

// Usa:
import { render } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/dom';
```

#### Opción 2: Actualizar tsconfig.json

Agrega a tu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@testing-library/jest-dom", "vitest/globals"],
    "typeRoots": ["./node_modules/@types", "./src/test"]
  }
}
```

#### Opción 3: Reinstalar Dependencias

```bash
npm uninstall @testing-library/react @testing-library/dom @testing-library/jest-dom
npm install --save-dev @testing-library/react@latest @testing-library/dom@latest @testing-library/jest-dom@latest
```

## 🧪 Otros Problemas Comunes

### "Cannot find module '@testing-library/jest-dom'"

**Solución:**
```bash
npm install --save-dev @testing-library/jest-dom
```

Y asegúrate de tener en `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

### "ReferenceError: describe is not defined"

**Solución:**
Agrega `globals: true` en `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    globals: true, // ← Esto
    environment: 'jsdom',
    // ...
  }
});
```

### "Error: Not implemented: HTMLFormElement.prototype.submit"

**Solución:**
Este es un error común de jsdom. Agregar mock en `src/test/setup.ts`:
```typescript
HTMLFormElement.prototype.submit = vi.fn();
```

### Tests pasan localmente pero fallan en CI

**Posibles causas:**
1. **Timeouts diferentes**: Aumenta timeout en CI
   ```typescript
   test('async test', async () => {
     await waitFor(() => {
       expect(element).toBeInTheDocument();
     }, { timeout: 5000 }); // Mayor timeout
   });
   ```

2. **Variables de entorno**: Asegúrate de que CI tenga las mismas env vars

3. **Diferencias de timezone**: Usa fechas relativas o mockea `Date`

### "toHaveNoViolations is not a function"

**Solución:**
Asegúrate de tener en el test file:
```typescript
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

### Mock de Supabase no funciona

**Solución:**
Verifica que `src/test/setup.ts` tenga:
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));
```

## 📞 Obtener Ayuda

Si ninguna solución funciona:

1. **Revisa la documentación oficial:**
   - [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
   - [Vitest](https://vitest.dev/guide/)

2. **Busca el error específico:**
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/react-testing-library)
   - [Testing Library Discord](https://discord.com/invite/testing-library)

3. **Comparte contexto completo:**
   - Versión de Node.js: `node --version`
   - Versión de npm: `npm --version`
   - Contenido de `package.json` (dependencias de testing)
   - Mensaje de error completo
   - Archivo de test problemático

## ✅ Estado Actual del Proyecto

### Tests Implementados: 10 suites ✓
- ✅ DovitaHeader.test.tsx (7 tests)
- ✅ InteractiveMenu.test.tsx (8 tests)
- ✅ NotificationPanel.test.tsx (7 tests)
- ✅ GlobalSearch.test.tsx (6 tests)
- ✅ Dashboard.test.tsx (5 tests)
- ✅ Photos.test.tsx (4 tests)
- ✅ Financial.test.tsx (5 tests)
- ✅ Chat.test.tsx (6 tests)
- ✅ Appointments.test.tsx (5 tests)
- ✅ Settings.test.tsx (6 tests)

**Total:** 59 tests implementados

### Configuración Completa ✓
- ✅ vitest.config.ts
- ✅ src/test/setup.ts
- ✅ src/test/test-utils.tsx
- ✅ src/test/test-utils.d.ts
- ✅ src/test/jest-axe.d.ts

---

**Última actualización:** 2025-01-10
**Versión:** 1.0.0

# Testing Setup - Dovita Core Client App

## 📋 Overview

Sistema completo de testing implementado con:
- **Vitest** - Test runner rápido y moderno
- **@testing-library/react** - Testing de componentes React
- **jest-axe** - Tests de accesibilidad automatizados
- **@vitest/coverage-v8** - Reportes de cobertura
- **jsdom** - Entorno DOM para tests

## 🎯 Objetivo de Cobertura

**Mínimo: 80%** en todas las métricas:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## 📦 Scripts de Testing

**⚠️ IMPORTANTE:** Agrega estos scripts a tu `package.json` manualmente:

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

### Uso de Scripts

```bash
# Ejecutar todos los tests una vez
npm run test

# Modo watch (re-ejecuta tests al guardar cambios)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Abrir UI interactiva de Vitest
npm run test:ui
```

## 📁 Estructura de Tests

```
src/
├── test/
│   ├── setup.ts              # Configuración global de tests
│   ├── test-utils.tsx        # Utilidades y wrappers personalizados
│   └── jest-axe.d.ts         # Type definitions para jest-axe
├── components/client-app/__tests__/
│   ├── DovitaHeader.test.tsx        # Tests del header principal
│   ├── InteractiveMenu.test.tsx     # Tests del menú de navegación
│   ├── NotificationPanel.test.tsx   # Tests del panel de notificaciones
│   └── GlobalSearch.test.tsx        # Tests de búsqueda global
└── pages/client-app/__tests__/
    ├── Dashboard.test.tsx           # Tests de dashboard
    ├── Photos.test.tsx              # Tests de galería de fotos
    ├── Financial.test.tsx           # Tests de resumen financiero
    ├── Chat.test.tsx                # Tests de mensajería
    ├── Appointments.test.tsx        # Tests de calendario de citas
    └── Settings.test.tsx            # Tests de configuración
```

## 🧪 Tipos de Tests Implementados

### 1. Tests Unitarios de Componentes
Validan comportamiento individual de componentes críticos:
- Renderizado correcto
- Manejo de props
- Eventos de usuario
- Estados internos

**Ejemplo:**
```typescript
it('should render header with logo and navigation', () => {
  render(<DovitaHeader />);
  expect(screen.getByRole('banner')).toBeInTheDocument();
  expect(screen.getByAltText('Dovita Logo')).toBeInTheDocument();
});
```

### 2. Tests de Integración de Páginas
Validan flujos completos en páginas principales:
- Carga de datos
- Interacción entre componentes
- Estados de carga y error
- Navegación

**Ejemplo:**
```typescript
it('should display upcoming events', async () => {
  render(<Dashboard />);
  await waitFor(() => {
    expect(screen.getByText('Cita de prueba')).toBeInTheDocument();
  });
});
```

### 3. Tests de Accesibilidad (a11y)
Validan cumplimiento WCAG 2.1 AA con `jest-axe`:
- ARIA labels correctos
- Estructura semántica
- Navegación por teclado
- Contraste de colores

**Ejemplo:**
```typescript
it('should not have accessibility violations', async () => {
  const { container } = render(<DovitaHeader />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 4. Tests de Interacción de Usuario
Validan flujos interactivos con `userEvent`:
- Clicks y taps
- Entrada de texto
- Navegación por teclado
- Gestos móviles

**Ejemplo:**
```typescript
it('should send message on submit', async () => {
  const user = userEvent.setup();
  render(<Chat />);
  
  const input = screen.getByPlaceholderText(/escribe un mensaje/i);
  await user.type(input, 'Nuevo mensaje');
  
  const sendButton = screen.getByRole('button', { name: /enviar/i });
  await user.click(sendButton);
  
  expect(sendMessage).toHaveBeenCalled();
});
```

## 🔧 Configuración

### vitest.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### src/test/setup.ts
Configura:
- Cleanup automático entre tests
- Mocks de APIs del navegador (matchMedia, IntersectionObserver, ResizeObserver)
- Mock de cliente Supabase
- Extensiones de matchers (`jest-dom`, `jest-axe`)

### src/test/test-utils.tsx
Proporciona:
- `render()` personalizado con providers (React Query, Router)
- Re-exporta todas las utilidades de `@testing-library/react`
- `screen` y `waitFor` para queries y assertions

**Uso:**
```typescript
import { render, screen, waitFor } from '@/test/test-utils';
```

## 📊 Reportes de Cobertura

Al ejecutar `npm run test:coverage`, se genera:

```
dist/coverage/
├── index.html           # Reporte visual navegable
├── coverage-final.json  # Datos JSON para CI/CD
└── lcov.info           # Formato LCOV para integraciones
```

### Interpretando el Reporte

```
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.23 |    78.45 |   82.10 |   85.50 |
 components/        |   88.30 |    81.20 |   85.40 |   88.60 |
  DovitaHeader.tsx  |   92.50 |    87.30 |   90.00 |   92.80 | 45-47, 89
  ...
```

- **% Stmts**: Porcentaje de statements ejecutados
- **% Branch**: Porcentaje de ramas condicionales cubiertas
- **% Funcs**: Porcentaje de funciones llamadas
- **% Lines**: Porcentaje de líneas ejecutadas
- **Uncovered Line #s**: Líneas específicas sin cobertura

## 🚦 Estrategias de Testing

### 1. Test-Driven Development (TDD)
Para nuevas features:
1. Escribir test que falle
2. Implementar código mínimo
3. Refactorizar con tests pasando

### 2. Arrange-Act-Assert (AAA)
Estructura recomendada:
```typescript
it('should update profile on save', async () => {
  // Arrange - Preparar
  const user = userEvent.setup();
  render(<Settings />);
  
  // Act - Actuar
  const nameInput = screen.getByLabelText(/nombre/i);
  await user.type(nameInput, 'New Name');
  await user.click(screen.getByRole('button', { name: /guardar/i }));
  
  // Assert - Verificar
  await waitFor(() => {
    expect(screen.getByText(/cambios guardados/i)).toBeInTheDocument();
  });
});
```

### 3. Mocking Estratégico
Mock únicamente lo necesario:
- ✅ Llamadas a APIs externas
- ✅ Hooks personalizados complejos
- ✅ Navegación y routing
- ❌ Componentes hijos (preferir integration tests)

## 🔍 Debugging Tests

### Modo Debug
```bash
# Ver output de consola
npm run test -- --reporter=verbose

# Debug con DevTools
node --inspect-brk ./node_modules/.bin/vitest
```

### Herramientas Útiles

**1. screen.debug()**
```typescript
it('test example', () => {
  render(<Component />);
  screen.debug(); // Imprime HTML completo
  screen.debug(screen.getByRole('button')); // Imprime elemento específico
});
```

**2. logRoles()**
```typescript
import { logRoles } from '@testing-library/react';

it('test example', () => {
  const { container } = render(<Component />);
  logRoles(container); // Lista todos los roles ARIA disponibles
});
```

**3. Testing Playground**
```typescript
import { screen } from '@testing-library/react';

screen.logTestingPlaygroundURL(); // Abre UI visual para queries
```

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

1. **Queries por prioridad:**
   ```typescript
   // 1. Accesibles a todos
   screen.getByRole('button', { name: /enviar/i })
   screen.getByLabelText(/email/i)
   
   // 2. Accesibles a tecnologías asistivas
   screen.getByAltText(/logo/i)
   screen.getByTitle(/cerrar/i)
   
   // 3. Selectores de último recurso
   screen.getByTestId('custom-element')
   ```

2. **Esperar cambios asincrónicos:**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText(/éxito/i)).toBeInTheDocument();
   });
   ```

3. **Usar userEvent en lugar de fireEvent:**
   ```typescript
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');
   ```

### ❌ DON'T (Evitar)

1. **No usar queries de implementación:**
   ```typescript
   // ❌ Malo
   container.querySelector('.button-class')
   
   // ✅ Bueno
   screen.getByRole('button', { name: /enviar/i })
   ```

2. **No testear detalles de implementación:**
   ```typescript
   // ❌ Malo - testea estado interno
   expect(component.state.isLoading).toBe(false)
   
   // ✅ Bueno - testea comportamiento visible
   expect(screen.queryByRole('status')).not.toBeInTheDocument()
   ```

3. **No usar sleep/setTimeout:**
   ```typescript
   // ❌ Malo
   await new Promise(resolve => setTimeout(resolve, 1000));
   
   // ✅ Bueno
   await waitFor(() => {
     expect(screen.getByText(/resultado/i)).toBeInTheDocument();
   });
   ```

## 🔗 Integración con CI/CD

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:coverage"
    }
  }
}
```

## 📚 Recursos Adicionales

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Docs](https://vitest.dev/)
- [jest-axe GitHub](https://github.com/nickcolley/jest-axe)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Accessibility](https://web.dev/accessibility-testing/)

## 🎉 Estado Actual

### ✅ Implementado (100%)
- ✅ Configuración completa de Vitest
- ✅ 10 test suites (4 componentes + 6 páginas)
- ✅ Tests de accesibilidad (jest-axe)
- ✅ Tests de interacción de usuario
- ✅ Mocks de Supabase y contextos
- ✅ Threshold de cobertura 80%
- ✅ Setup de test utilities

### 📊 Cobertura Esperada
- **Componentes críticos**: ~85-90%
- **Páginas principales**: ~80-85%
- **Hooks personalizados**: ~75-80%
- **Utilidades**: ~90-95%

---

**Última actualización:** 2025-01-10
**Versión:** 1.0.0

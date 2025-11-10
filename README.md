# Dovita CRM - Sistema Integral de Gestión de Construcción

Sistema completo de gestión empresarial (ERP) especializado en construcción, con portal de clientes integrado.

---

## 🏗️ Arquitectura del Sistema

### Backoffice (ERP)
Sistema interno para colaboradores de Dovita con gestión completa del negocio.

- **Rutas**: `/`, `/clientes`, `/proyectos`, `/presupuestos`, `/construccion`, `/finanzas`, etc.
- **Layout**: `InternalLayout` con `AppSidebar` colapsable
- **Estilo**: Corporativo, tema claro/oscuro, sidebar navegable
- **Usuarios**: Colaboradores internos con roles y permisos

### Client App (Portal de Clientes)
Portal web progresivo (PWA) para que clientes visualicen en tiempo real el progreso de sus proyectos.

- **Rutas**: `/client/*` (dashboard, photos, financial, chat, documents, schedule, appointments, settings)
- **Layout Mobile**: `ClientApp` con `InteractiveMenu` en footer
- **Layout Desktop**: `ClientAppDesktop` con `FloatingIslandSidebar` flotante
- **Estilo**: Moderno, mobile-first, navegación intuitiva
- **Usuarios**: Clientes finales con acceso a sus proyectos

**📘 [Guía completa de separación de diseño](./docs/DESIGN_SEPARATION.md)**

---

## 🔄 Client App - Arquitectura de Datos

El Client App funciona con un **sistema dual-source** que permite consumir datos de dos fuentes:
- **Mock Data**: Datos simulados para desarrollo, demos y testing
- **Real Data**: Datos reales desde Supabase via vistas SQL especializadas

### Sistema de Fuentes de Datos

El `DataSourceContext` administra la conmutación automática entre fuentes:
- En **modo preview** (`/client?preview=true`): permite al equipo interno "ver como cliente" seleccionando cualquier cliente real del sistema
- En **modo producción**: los clientes autenticados consumen automáticamente sus datos reales
- La selección se persiste en `localStorage` para mantener el estado entre recargas

### Datos Reales (Supabase Views)

El sistema cuenta con **8 vistas SQL optimizadas** que exponen datos del ERP al Client App:

| Vista | Propósito | Estado |
|-------|-----------|--------|
| `v_client_projects` | Listado de proyectos del cliente | ✅ Funcional |
| `v_client_project_summary` | Dashboard con KPIs y fechas | ✅ Funcional |
| `v_client_documents` | Documentos visibles al cliente | ✅ Funcional |
| `v_client_photos` | Fotos de construcción | ✅ Funcional |
| `v_client_appointments` | Citas y reuniones | ⚠️ Falta ubicación |
| `v_client_ministrations` | Cronograma de pagos | ⚠️ Falta estado de pago |
| `v_client_financial_summary` | Resumen financiero | ✅ Funcional |
| `v_client_budget_categories` | Desglose presupuestal | ✅ Funcional |

### Datos Faltantes Críticos

Para hacer el Client App **100% funcional con datos reales**, se requieren:

**🔴 Críticos**:
- [ ] `calendar_events.location` / `meeting_link` / `visibility`
- [ ] Tabla `project_members` para mostrar equipo del proyecto
- [ ] `projects.progress_override` o función de cálculo automático
- [ ] `gantt_ministrations.invoice_id` para estado de pago

**🟡 Deseables**:
- [ ] `construction_photos.phase_id` para vincular fotos a fases
- [ ] Tabla `chat_messages` para mensajería en tiempo real
- [ ] Función `calculate_project_progress()` basada en gantt

### Hooks Unificados

El sistema usa hooks que automáticamente conmutan entre mock y real:

```typescript
// Ejemplo: documentos del proyecto
const { data, isLoading, source } = useUnifiedDocuments(projectId);
// source = 'mock' | 'real' (automático según contexto)
```

Hooks disponibles:
- `useUnifiedDocuments` - Documentos del proyecto
- `useUnifiedPhotos` - Fotos de construcción
- `useUnifiedMinistrations` - Cronograma de pagos
- `useUnifiedFinancialSummary` - Resumen financiero
- `useUnifiedBudgetCategories` - Categorías presupuestales
- `useUnifiedAppointments` - Citas y reuniones

### Documentación Completa

📘 **[CLIENT_APP_DATA.md](./docs/CLIENT_APP_DATA.md)** - Análisis exhaustivo de:
- Estructura completa de datos mock
- Especificaciones de las 8 vistas SQL
- Mapeo detallado Mock → Real (20+ campos)
- Plan de implementación por fases
- Checklist de datos faltantes
- Ejemplos de código y uso
- Políticas de seguridad (RLS)

---

## Datos Mock (Desarrollo)

Para facilitar pruebas end-to-end, el proyecto incluye scripts para sembrar y limpiar datos de prueba.

### Requisitos

Configura las siguientes variables en tu archivo `.env` local:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
ADMIN_EMAIL=admin@dovita.test
ADMIN_PASSWORD=AdminPass123!
VITE_APP_URL=http://localhost:8080
```

⚠️ **Importante**: El `SERVICE_ROLE_KEY` **NO** debe usarse en producción ni exponerse en el frontend. Solo para scripts locales/CI.

### Sembrar datos de prueba

```bash
npm run seed:mock
```

Esto creará:
- **10 clientes** con leads asociados
- **10 proyectos** distribuidos en 3 flujos:
  - 4 proyectos: Solo presupuesto Arquitectónico
  - 3 proyectos: Arquitectónico + Ejecutivo + Gantt + Calendario + Chat
  - 3 proyectos: Flujo completo (incluye Órdenes de Compra, transacciones bancarias)
- Presupuestos con partidas por mayor
- Cronogramas Gantt
- Órdenes de compra y movimientos financieros
- Eventos de calendario
- Mensajes de chat

Todos los registros se etiquetan con `MOCK_DOVITA` y `MOCK_DOVITA_BATCH_001` para fácil identificación.

### Limpiar datos de prueba

```bash
npm run seed:cleanup
```

Elimina **todos** los registros etiquetados como mock, en orden seguro (hijos → padres).

### Casos de uso

- **Testing E2E**: Valida flujos completos desde leads hasta facturación
- **Demos**: Presenta el sistema con datos realistas
- **Desarrollo**: Trabaja con datos consistentes sin afectar producción

---

## 🧪 Testing

### Unit & Integration Tests

El proyecto utiliza **Vitest** + **@testing-library/react** + **jest-axe** para tests automatizados.

**Ejecutar tests:**

```bash
npm run test
```

**Tests en modo watch:**

```bash
npm run test:watch
```

**Coverage report:**

```bash
npm run test:coverage
```

**Tests UI (interactivo):**

```bash
npm run test:ui
```

**Estructura de tests:**
- `src/components/client-app/__tests__/` - Tests unitarios de componentes
- `src/pages/client-app/__tests__/` - Tests de integración de páginas
- Tests de accesibilidad con `jest-axe` en todos los componentes
- Objetivo: **80% de cobertura** mínima

### Smoke Tests Automatizados

El proyecto incluye smoke tests automatizados usando Playwright para validar los flujos principales.

**Instalar Playwright:**

```bash
npx playwright install
```

**Ejecutar tests:**

```bash
npx playwright test
```

**Ver reporte:**

```bash
npx playwright show-report
```

**Casos cubiertos:**
- ✅ Login y autenticación
- ✅ Navegación entre módulos (Planeación, Construcción, Finanzas, Contabilidad)
- ✅ Portal del cliente (presupuesto y resumen financiero)
- ✅ Chat en tiempo real
- ✅ Calendario de eventos
- ✅ Exportaciones PDF/XLSX
- ✅ Upload CFDI y registro en tabla
- ✅ Verificación de datos mock (10 proyectos)
- ✅ Logout y redirección

📖 **Documentación completa**: [`docs/QA_SMOKE.md`](docs/QA_SMOKE.md)

---

## Performance Optimizations

### Build Analysis

Analiza el tamaño del bundle con:

```bash
ANALYZE=true npm run build
```

Se generará un reporte visual en `dist/stats.html`.

### Optimizaciones Implementadas

#### 1. **Code-Splitting y Lazy Loading**
- Rutas cargadas dinámicamente con `React.lazy()`
- Skeletons de carga para mejor UX
- Chunks manuales para librerías vendor

#### 2. **Query Caching (TanStack Query)**
- **Catálogos** (bancos, proveedores): `staleTime: 60s, gcTime: 5min`
- **Datos activos** (transacciones, OCs): `staleTime: 15s, gcTime: 5min`
- Prefetch automático al hacer hover en sidebar (desktop)
- Debounce de 300ms en filtros de búsqueda

#### 3. **Virtualización de Tablas**
- Tablas grandes usan `@tanstack/react-virtual`
- Sticky headers mantenidos
- Scroll horizontal en móvil preservado
- `React.memo` para optimizar renders de filas

#### 4. **Realtime Optimizado**
- Una sola suscripción por `project_id`
- Auto-reconnect en caso de desconexión
- Cleanup automático al desmontar componentes

#### 5. **Build Production**
- Source maps deshabilitados en producción
- Tree-shaking de `xlsx` y `jspdf` (importación dinámica)
- Chunks vendor separados para mejor cache

### Usar Exportaciones

Las exportaciones PDF/XLSX ahora se cargan bajo demanda:

```typescript
import { exportToExcel, exportToPDF } from "@/utils/lazyExports";

// Excel
await exportToExcel(data, "reporte");

// PDF
await exportToPDF("Título", ["Col1", "Col2"], rows, "reporte");
```

---

## Project info

**URL**: https://lovable.dev/projects/e87f68f6-93fd-48c6-9d4c-0bdedf329979

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e87f68f6-93fd-48c6-9d4c-0bdedf329979) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e87f68f6-93fd-48c6-9d4c-0bdedf329979) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

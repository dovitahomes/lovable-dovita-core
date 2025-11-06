# Separación de Diseño: ERP vs Client App

## Regla de Oro

**NUNCA** mezclar componentes del ERP con componentes de Client App.

---

## Arquitectura de Diseño

### Backoffice (ERP)
- **Rutas**: `/`, `/clientes`, `/proyectos`, `/presupuestos`, `/construccion`, `/finanzas`, etc.
- **Layout**: `InternalLayout` con `AppSidebar`
- **Estilo**: Corporativo, sidebar colapsable, tema claro/oscuro
- **Contexto**: `AuthProvider`, `ThemeProvider`, `SidebarThemeProvider`

### Client App (Portal de Clientes)
- **Rutas**: `/client/*` (dashboard, photos, financial, chat, documents, schedule, appointments, settings)
- **Layout Mobile**: `ClientApp` con `InteractiveMenu` en footer
- **Layout Desktop**: `ClientAppDesktop` con `FloatingIslandSidebar`
- **Estilo**: Moderno, mobile-first, sin sidebar del ERP, navegación flotante
- **Contexto**: `DataSourceProvider`, `ProjectProvider`, `NotificationProvider`

---

## Componentes Exclusivos

### ERP (Backoffice)

#### Layouts
- `InternalLayout` (definido en `src/App.tsx`)
- Header con `SidebarTrigger` y toggle de tema

#### Componentes
- `AppSidebar.tsx` - Sidebar principal del ERP
- Componentes en `src/components/` (sin subcarpeta `client-app/`)

#### Estilos
- `src/components/ui/sidebar-styles.css` - Estilos específicos del sidebar
- Variables CSS: `--sidebar-*`

### Client App

#### Layouts
- `src/layouts/ClientAppWrapper.tsx` - Wrapper principal con providers
- `src/pages/client-app/ClientApp.tsx` - Layout mobile
- `src/pages/client-app/ClientAppDesktop.tsx` - Layout desktop
- `src/pages/client-app/ResponsiveClientApp.tsx` - Switcher responsive

#### Componentes
- `DovitaHeader.tsx` / `DovitaHeaderDesktop.tsx` - Headers personalizados
- `FloatingIslandSidebar.tsx` - Navegación flotante desktop
- `InteractiveMenu.tsx` - Menú inferior mobile
- `PreviewBar.tsx` - Barra superior en modo preview
- Todos en `src/components/client-app/`

#### Páginas
- Todas en `src/pages/client-app/`
- Dashboard, Photos, Financial, Chat, Documents, Schedule, Appointments, Settings
- Cada una con versión Mobile y Desktop

#### Hooks
- Todos en `src/hooks/client-app/`
- `useAppMode.ts`, `useAuthClientId.ts`, `useClientData.ts`, etc.

#### Contextos
- Todos en `src/contexts/client-app/`
- `DataSourceContext.tsx`, `ProjectContext.tsx`

#### Estilos
- Clases prefijadas: `.client-menu`, `.client-menu__item`, `.client-menu__icon`
- Variables CSS: `--client-nav-*`, `--dovita-*`

---

## ¿Cómo Agregar Features?

### Para Backoffice (ERP)

1. **Crear componente**:
   ```bash
   src/components/NuevoComponente.tsx
   ```

2. **Usar dentro de InternalLayout**:
   ```tsx
   // src/App.tsx
   <Route path="/nueva-ruta" element={<NuevoComponente />} />
   ```

3. **Puede usar**:
   - `AppSidebar` para navegación
   - `SidebarTrigger` para toggle
   - Variables `--sidebar-*` para estilos

### Para Client App (Portal de Clientes)

1. **Crear componente**:
   ```bash
   src/components/client-app/NuevoComponente.tsx
   ```

2. **Usar dentro de ClientAppWrapper**:
   ```tsx
   // src/layouts/ClientAppWrapper.tsx
   <Route path="nueva-ruta" element={<ResponsiveNuevaRuta />} />
   ```

3. **Crear versiones responsive**:
   ```tsx
   // src/pages/client-app/NuevaRuta.tsx (Mobile)
   // src/pages/client-app/NuevaRutaDesktop.tsx (Desktop)
   // src/pages/client-app/ResponsiveNuevaRuta.tsx (Switcher)
   ```

4. **NO usar**:
   - ❌ `AppSidebar` ni componentes del ERP
   - ❌ `InternalLayout`
   - ❌ Variables `--sidebar-*`

---

## Routing y Navegación

### ERP
```tsx
// Todas las rutas dentro de InternalLayout
<Route path="/*" element={
  <ProtectedRoute>
    <InternalLayout />
  </ProtectedRoute>
} />
```

### Client App
```tsx
// Rutas completamente separadas
<Route path="/client/*" element={
  <ProtectedRoute>
    <ClientAppWrapper />
  </ProtectedRoute>
} />
```

**Importante**: Las rutas de Client App son **relativas** a `/client`:
- `/client` → Dashboard
- `/client/photos` → Fotos
- `/client/financial` → Financiero

---

## Estilos y CSS

### Aislamiento de Estilos

```css
/* ❌ MAL - Sin prefijo, puede afectar al ERP */
.menu {
  background: var(--client-nav-bg);
}

/* ✅ BIEN - Prefijo client- para aislamiento */
.client-menu {
  background: var(--client-nav-bg);
}
```

## Separación de Comportamiento de Scroll

### ERP (Backoffice)
- ✅ Scroll natural en `body` (comportamiento por defecto del navegador)
- ✅ Páginas largas pueden hacer scroll libremente
- ✅ Sin restricciones de `overflow` o `position: fixed` en body
- ✅ Funciona con sidebar colapsable sin conflictos

### Client App (Portal de Clientes)
- ✅ `body` fijo con `overflow: hidden` (solo dentro de `.client-app-container`)
- ✅ Scroll SOLO en `<main className="overflow-y-auto">` del layout
- ✅ Altura fija de viewport (`100vh`) para navegación móvil
- ✅ Bottom nav (`InteractiveMenu`) siempre visible sin que el scroll lo oculte

### Implementación Técnica

**CSS en `src/index.css`**:
```css
/* ERP mantiene scroll normal por defecto */
body {
  @apply bg-background text-foreground;
}

/* Client App: contenedor fijo sin scroll en body */
.client-app-container {
  overflow: hidden;
  height: 100vh;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
}
```

**Client App Layout**:
```tsx
// src/layouts/ClientAppWrapper.tsx
export default function ClientAppWrapper() {
  return (
    <div className="client-app-container">
      <DataSourceProvider>
        {/* Contenido */}
      </DataSourceProvider>
    </div>
  );
}

// src/pages/client-app/ClientApp.tsx (Mobile)
<main className="flex-1 overflow-y-auto overflow-x-hidden">
  {/* Aquí va el scroll */}
</main>
```

### Regla Crítica de Scroll
**NUNCA** aplicar estilos de scroll de Client App de forma global. Siempre usar:
- `.client-app-container` para aislar estilos específicos de Client App
- Mantener `body` limpio para que el ERP tenga scroll normal
- Scroll en Client App SOLO dentro del `<main>` del layout

### Variables CSS

**ERP**:
```css
--sidebar-background: 222 47% 11%;
--sidebar-foreground: 220 17% 97%;
--sidebar-primary: 221 83% 53%;
```

**Client App**:
```css
--client-nav-bg: rgba(6, 12, 28, 0.72);
--client-nav-border: rgba(255,255,255,0.08);
--client-nav-fg: #c8cbe0;
--dovita-blue: 222 71% 40%;
--dovita-yellow: 48 100% 65%;
```

---

## Modo Preview

### ¿Qué es el Modo Preview?

Permite a colaboradores del ERP ver la Client App como si fueran clientes, con controles adicionales:

- **URL**: `/client?preview=1`
- **Acceso**: Solo colaboradores con rol en `user_roles`
- **Características**:
  - `PreviewBar` superior con selector de cliente
  - Toggle Mock/Real Data
  - Botón "Volver a Backoffice"

### Implementación

```tsx
// PreviewBar solo se renderiza en /client/* y con isPreviewMode=true
const isPreviewMode = localStorage.getItem("clientapp.previewMode") === "true" || 
                      new URLSearchParams(window.location.search).has("preview");
```

### Padding para PreviewBar

```tsx
// Dashboard.tsx (Mobile)
const { isPreviewMode } = useDataSource();

return (
  <div style={{ paddingTop: isPreviewMode ? '48px' : '0' }}>
    <PreviewBar />
    {/* Contenido */}
  </div>
);
```

---

## Responsive Design

### Breakpoints

```tsx
// src/hooks/use-mobile.tsx
const MOBILE_BREAKPOINT = 768;

// Mobile: < 768px
// Desktop: >= 768px
```

### Patrón de Componentes Responsive

```tsx
// ResponsiveDashboard.tsx
import { useIsMobile } from '@/hooks/use-mobile';
import Dashboard from './Dashboard';          // Mobile
import DashboardDesktop from './DashboardDesktop'; // Desktop

export default function ResponsiveDashboard() {
  const isMobile = useIsMobile();
  return isMobile ? <Dashboard /> : <DashboardDesktop />;
}
```

---

## 🎯 Beneficios de Esta Arquitectura

1. ✅ **UI/UX Preservada**: Client App mantiene su diseño moderno intacto
2. ✅ **Separación Clara**: ERP y Client App no se mezclan
3. ✅ **Un Solo Servidor**: Funciona en Lovable Sandbox
4. ✅ **Responsive Completo**: Mobile/Tablet/Desktop de Client App funcional
5. ✅ **Modo Preview**: Colaboradores pueden ver como cliente sin interferencia
6. ✅ **Mantenibilidad**: Código del ERP no afecta Client App y viceversa

---

## ⚠️ Notas Críticas

### 1. NO usar AppSidebar en Client App
El sidebar del ERP rompe el diseño moderno del Client App.

**❌ MAL**:
```tsx
// Client App usando AppSidebar
import { AppSidebar } from '@/components/AppSidebar';

function ClientApp() {
  return <AppSidebar />; // ¡NUNCA!
}
```

**✅ BIEN**:
```tsx
// Client App con su propio sidebar
import FloatingIslandSidebar from '@/components/client-app/FloatingIslandSidebar';

function ClientAppDesktop() {
  return <FloatingIslandSidebar />;
}
```

### 2. NO usar InternalLayout para /client/*
Debe tener su propio wrapper completamente separado.

### 3. Respetar prefijos de CSS
- `.client-menu` para InteractiveMenu
- `.sidebar` para AppSidebar del ERP

### 4. Separar contextos
`ProjectContext` del ERP ≠ `ProjectContext` de Client App

### 5. Testing visual obligatorio
Verificar en mobile, tablet y desktop antes de desplegar.

---

## Checklist de Verificación

Antes de hacer commit, verificar:

- [ ] `/` muestra ERP con `AppSidebar`
- [ ] `/client` muestra Client App SIN `AppSidebar`
- [ ] Mobile: `InteractiveMenu` en footer funciona
- [ ] Desktop: `FloatingIslandSidebar` flotante funciona
- [ ] Modo Preview muestra `PreviewBar` solo en `/client/*`
- [ ] Estilos `.client-menu` no afectan al ERP
- [ ] Estilos `sidebar-styles.css` no afectan a Client App
- [ ] Navegación entre rutas funciona correctamente
- [ ] Theme switcher funciona en ERP
- [ ] Responsive funciona en todos los breakpoints

---

## Troubleshooting

### ❌ El sidebar del ERP aparece en Client App
**Solución**: Verificar que `/client/*` use `ClientAppWrapper`, no `InternalLayout`.

### ❌ InteractiveMenu no se ve en mobile
**Solución**: Verificar que `useIsMobile()` detecte correctamente y que esté dentro de `ClientApp.tsx`.

### ❌ PreviewBar aparece en el ERP
**Solución**: Verificar que `PreviewBar` solo se renderice cuando `location.pathname.startsWith('/client')`.

### ❌ Estilos mezclados entre ERP y Client App
**Solución**: Usar prefijos `.client-*` para Client App, verificar orden de imports en `index.css`.

---

## Estructura de Archivos

```
src/
├── App.tsx                          # Routing principal
├── index.css                        # Estilos globales + variables
├── components/
│   ├── AppSidebar.tsx              # Sidebar del ERP
│   ├── ui/
│   │   └── sidebar-styles.css      # Estilos del sidebar ERP
│   └── client-app/                 # ⭐ Componentes exclusivos Client App
│       ├── DovitaHeader.tsx
│       ├── DovitaHeaderDesktop.tsx
│       ├── FloatingIslandSidebar.tsx
│       ├── InteractiveMenu.tsx
│       └── PreviewBar.tsx
├── layouts/
│   └── ClientAppWrapper.tsx        # ⭐ Wrapper principal Client App
├── pages/
│   └── client-app/                 # ⭐ Páginas Client App
│       ├── ClientApp.tsx           # Layout mobile
│       ├── ClientAppDesktop.tsx    # Layout desktop
│       ├── ResponsiveClientApp.tsx # Switcher
│       ├── Dashboard.tsx / DashboardDesktop.tsx
│       ├── Photos.tsx / PhotosDesktop.tsx
│       └── ...
├── hooks/
│   ├── use-mobile.tsx              # Hook responsive compartido
│   └── client-app/                 # ⭐ Hooks exclusivos Client App
│       ├── useAppMode.ts
│       ├── useClientData.ts
│       └── useProjectsData.ts
├── contexts/
│   └── client-app/                 # ⭐ Contextos exclusivos Client App
│       ├── DataSourceContext.tsx
│       └── ProjectContext.tsx
└── lib/
    └── client-app/                 # ⭐ Utilidades Client App
        ├── client-data.ts
        └── dataAdapters.ts
```

---

## Migración y Refactoring

Si necesitas migrar features entre ERP y Client App:

### De ERP a Client App
1. Copiar componente a `src/components/client-app/`
2. Adaptar estilos con prefijos `.client-*`
3. Remover dependencias de `AppSidebar`
4. Usar contextos de Client App
5. Agregar versiones Mobile y Desktop

### De Client App a ERP
1. Copiar componente a `src/components/`
2. Adaptar estilos para tema del ERP
3. Integrar con `InternalLayout`
4. Usar contextos del ERP
5. Testing con `AppSidebar`

---

## Mantenimiento

### Al agregar nuevas páginas a Client App:
1. Crear 3 archivos: `Pagina.tsx`, `PaginaDesktop.tsx`, `ResponsivePagina.tsx`
2. Agregar ruta en `ClientAppWrapper.tsx`
3. Agregar ítem en menús (`InteractiveMenu`, `FloatingIslandSidebar`)
4. Integrar `PreviewBar` con padding dinámico
5. Testing responsive completo

### Al modificar estilos compartidos:
1. Verificar impacto en ERP Y Client App
2. Usar variables CSS en `index.css`
3. Evitar hardcodear colores
4. Testing visual en ambas apps

---

## Referencias

- [Client App Integration Guide](./CLIENT_APP_INTEGRATION.md)
- [Client Dev Setup](./CLIENT_DEV_SETUP.md)
- [Lovable Documentation](https://docs.lovable.dev)

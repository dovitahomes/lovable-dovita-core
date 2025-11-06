# Arquitectura de Rutas - Dovita Core

## 📋 Tabla de Contenidos

1. [Estructura General](#estructura-general)
2. [Contextos de Rutas](#contextos-de-rutas)
3. [Uso de Constantes](#uso-de-constantes)
4. [Reglas de Desarrollo](#reglas-de-desarrollo)
5. [Troubleshooting](#troubleshooting)

---

## Estructura General

Dovita Core tiene tres contextos principales de rutas completamente separados:

```
/
├── /auth/*              → PÚBLICO: Autenticación (login, callback, reset)
├── /client/*            → CLIENT APP: Portal para clientes finales
│   ├── /client                    → Dashboard (index)
│   ├── /client/dashboard          → Dashboard (explícito)
│   ├── /client/photos             → Galería de fotos
│   ├── /client/financial          → Resumen financiero
│   ├── /client/chat               → Chat con el equipo
│   ├── /client/documents          → Documentos del proyecto
│   ├── /client/schedule           → Cronograma de construcción
│   ├── /client/appointments       → Citas y reuniones
│   └── /client/settings           → Configuración de perfil
└── /*                   → BACKOFFICE: ERP interno para colaboradores
    ├── /                          → Dashboard principal
    ├── /ver-como-cliente          → Preview mode (ver como cliente)
    ├── /leads                     → CRM - Leads
    ├── /clientes                  → CRM - Clientes
    ├── /proyectos                 → Gestión de proyectos
    ├── /gantt                     → Cronograma unificado
    ├── /construccion              → Módulo de construcción
    ├── /proveedores               → Catálogo de proveedores
    ├── /ordenes-compra            → Órdenes de compra
    ├── /lotes-pago                → Lotes de pago a proveedores
    ├── /contabilidad              → Contabilidad y facturas
    └── /herramientas/*            → Configuración administrativa
```

---

## Contextos de Rutas

### 1. 🌐 PUBLIC (Rutas Públicas)

**Acceso**: Sin autenticación  
**Propósito**: Login, callback OAuth, reset de contraseña

**Rutas Disponibles**:
- `/auth/login` - Página de login
- `/auth/callback` - Callback de OAuth (Supabase)
- `/auth/reset` - Reset de contraseña
- `/debug` - Herramientas de debug (solo desarrollo)

**Protección**: Ninguna (acceso público)

**Código**:
```typescript
import { PUBLIC_ROUTES } from '@/config/routes';

// ✅ CORRECTO
<Route path={PUBLIC_ROUTES.AUTH_LOGIN} element={<Login />} />

// ❌ INCORRECTO
<Route path="/auth/login" element={<Login />} />
```

---

### 2. 👤 CLIENT APP (Portal de Clientes)

**Acceso**: Clientes autenticados con proyectos asignados  
**Base**: `/client/*`  
**Propósito**: Portal móvil-first para que clientes vean el progreso de sus proyectos

**Características**:
- ✅ Mobile-first design
- ✅ Menú inferior interactivo (iOS-style)
- ✅ Solo ven sus propios proyectos
- ❌ NO pueden ver proyectos de otros clientes
- ❌ NO pueden acceder al backoffice
- ❌ NO ven PreviewBar

**Rutas Disponibles**:
- `/client` - Dashboard (index)
- `/client/dashboard` - Dashboard (explícito)
- `/client/photos` - Galería de fotos del proyecto
- `/client/financial` - Resumen financiero
- `/client/chat` - Chat con el equipo de construcción
- `/client/documents` - Documentos del proyecto
- `/client/schedule` - Cronograma visual de construcción
- `/client/appointments` - Citas y reuniones programadas
- `/client/settings` - Configuración de perfil y avatar

**Protección**: `ProtectedRoute` + verificación de rol `client`

**Código**:
```typescript
import { CLIENT_APP_ROUTES } from '@/config/routes';

// ✅ CORRECTO - En navegación
navigate(CLIENT_APP_ROUTES.PHOTOS);

// ✅ CORRECTO - En ClientAppWrapper (rutas relativas)
import { CLIENT_APP_RELATIVE_ROUTES } from '@/config/routes';
<Route path={CLIENT_APP_RELATIVE_ROUTES.PHOTOS} element={<Photos />} />
```

---

### 3. 🏢 BACKOFFICE (ERP Interno)

**Acceso**: Colaboradores autenticados con roles en `user_roles`  
**Base**: `/*` (todas las demás rutas)  
**Propósito**: ERP completo para gestión interna

**Características**:
- ✅ Acceso completo a todos los módulos (según permisos)
- ✅ Pueden usar "Ver como Cliente" (preview mode)
- ✅ Sidebar colapsable con temas claro/oscuro
- ✅ Protección granular por módulo
- ✅ Ven PreviewBar cuando están en preview mode

**Módulos Principales**:

#### CRM
- `/leads` - Pipeline de leads
- `/clientes` - Listado de clientes
- `/clientes/:id` - Detalle de cliente

#### Proyectos
- `/proyectos` - Listado de proyectos
- `/proyectos/:id` - Detalle de proyecto
- `/diseno` - Gestión de diseño

#### Presupuestos
- `/presupuestos` - Listado de presupuestos
- `/presupuestos/:id` - Presupuesto paramétrico
- `/presupuestos/nuevo-ejecutivo` - Presupuesto ejecutivo

#### Construcción
- `/gantt` - Cronograma unificado (paramétrico/ejecutivo)
- `/construccion` - Seguimiento de obra
- `/construccion/:id` - Detalle de construcción
- `/construccion/proyectos/:projectId/cronograma` - Cronograma de proyecto

#### Finanzas
- `/proveedores` - Catálogo de proveedores
- `/ordenes-compra` - Órdenes de compra
- `/lotes-pago` - Lotes de pago a proveedores
- `/lotes-pago/:id` - Detalle de lote de pago
- `/contabilidad` - Contabilidad y facturas CFDI
- `/comisiones` - Comisiones de alianzas y colaboradores

#### Herramientas
- `/herramientas/contenido-corporativo` - Logos y membrete
- `/herramientas/usuarios` - Gestión de usuarios y roles
- `/herramientas/identidades` - Sincronización auth ↔ profiles
- `/herramientas/accesos` - Permisos granulares
- `/erp/transactions` - Catálogo TU (Transacciones Unificadas)
- `/erp/budgets` - Presupuestos ERP

**Protección**: `ProtectedRoute` + `useModuleAccess()` para permisos granulares

**Código**:
```typescript
import { BACKOFFICE_ROUTES, generateRoute } from '@/config/routes';

// ✅ CORRECTO - Rutas estáticas
<Route path={BACKOFFICE_ROUTES.LEADS} element={<Leads />} />

// ✅ CORRECTO - Rutas dinámicas
const clientId = "abc123";
navigate(generateRoute.clienteDetalle(clientId)); // /clientes/abc123
```

---

## Uso de Constantes

### ✅ Importar Constantes

```typescript
// Para rutas públicas
import { PUBLIC_ROUTES } from '@/config/routes';

// Para client app
import { CLIENT_APP_ROUTES, CLIENT_APP_RELATIVE_ROUTES } from '@/config/routes';

// Para backoffice
import { BACKOFFICE_ROUTES, generateRoute } from '@/config/routes';
```

### ✅ En Componentes de Navegación

```typescript
import { CLIENT_APP_ROUTES } from '@/config/routes';

const menuItems = [
  { label: "Inicio", icon: Home, path: CLIENT_APP_ROUTES.BASE },
  { label: "Fotos", icon: Image, path: CLIENT_APP_ROUTES.PHOTOS },
  { label: "Financiero", icon: DollarSign, path: CLIENT_APP_ROUTES.FINANCIAL },
];
```

### ✅ En Definición de Rutas (React Router)

```typescript
import { BACKOFFICE_ROUTES } from '@/config/routes';

<Routes>
  <Route path={BACKOFFICE_ROUTES.LEADS} element={<Leads />} />
  <Route path={BACKOFFICE_ROUTES.CLIENTE_DETALLE} element={<ClienteDetalle />} />
</Routes>
```

### ✅ Para Rutas Dinámicas

```typescript
import { generateRoute } from '@/config/routes';

// Navegar a detalle de cliente
navigate(generateRoute.clienteDetalle("abc123"));

// Navegar a client app en preview mode
navigate(generateRoute.clientWithPreview());
```

---

## Reglas de Desarrollo

### 🔴 PROHIBIDO

1. ❌ **Hardcodear strings de rutas en componentes**
   ```typescript
   // ❌ MAL
   navigate("/client/photos");
   
   // ✅ BIEN
   import { CLIENT_APP_ROUTES } from '@/config/routes';
   navigate(CLIENT_APP_ROUTES.PHOTOS);
   ```

2. ❌ **Mezclar rutas de CLIENT_APP con BACKOFFICE**
   ```typescript
   // ❌ MAL - Cliente no puede ir al backoffice
   navigate("/proyectos");
   
   // ✅ BIEN - Cliente solo puede ir a client app
   navigate(CLIENT_APP_ROUTES.DASHBOARD);
   ```

3. ❌ **Crear rutas sin agregar a `routes.ts`**
   ```typescript
   // ❌ MAL - Crear ruta nueva sin documentar
   <Route path="/nueva-ruta" element={<NuevaRuta />} />
   
   // ✅ BIEN - Primero agregar a routes.ts, luego usar constante
   // 1. Agregar a src/config/routes.ts
   export const BACKOFFICE_ROUTES = {
     // ...
     NUEVA_RUTA: '/nueva-ruta',
   } as const;
   
   // 2. Usar la constante
   <Route path={BACKOFFICE_ROUTES.NUEVA_RUTA} element={<NuevaRuta />} />
   ```

### 🟢 OBLIGATORIO

1. ✅ **Siempre usar constantes de `routes.ts`**
2. ✅ **Documentar rutas nuevas en este archivo**
3. ✅ **Usar helpers para rutas dinámicas**
4. ✅ **Mantener separación clara entre contextos**
5. ✅ **Agregar redirects legacy cuando cambies rutas**

---

## Flujo: "Ver como Cliente" (Preview Mode)

### Para Colaboradores

1. **Activación**:
   - Click en "Ver como Cliente" en sidebar
   - Se ejecuta `/ver-como-cliente`
   - Redirige a `/client?preview=true`

2. **Comportamiento**:
   - ✅ Ve la misma vista que un cliente
   - ✅ Aparece PreviewBar (lengüeta amarilla) en la esquina
   - ✅ Puede cambiar entre clientes usando el selector
   - ✅ Puede regresar al backoffice con botón "Backoffice"

3. **Restricciones**:
   - ❌ NO modifica base de datos
   - ❌ NO envía notificaciones reales
   - ✅ Es una vista de SOLO LECTURA simulada

### Para Clientes Reales

- ❌ NUNCA ven PreviewBar
- ❌ NO pueden acceder a `/ver-como-cliente`
- ❌ NO pueden cambiar de cliente
- ✅ Solo ven sus propios proyectos

---

## Troubleshooting

### Problema: "Página en Blanco al Navegar"

**Causa**: Ruta no está definida o layout incorrecto

**Solución**:
1. Verificar que la ruta esté en `src/config/routes.ts`
2. Verificar que esté registrada en `src/App.tsx`
3. Verificar que el layout padre sea correcto:
   - Client App: dentro de `<ClientAppWrapper />`
   - Backoffice: dentro de `<InternalLayout />`

### Problema: "PreviewBar No Aparece"

**Causa**: No está en preview mode o no es colaborador

**Solución**:
1. Verificar en localStorage: `clientapp.previewMode = "true"`
2. Verificar URL: debe tener `?preview=true`
3. Verificar rol: debe ser `collaborator` (tiene registro en `user_roles`)

### Problema: "Cliente Ve Proyectos de Otros"

**Causa**: Falta filtro por cliente en query

**Solución**:
1. Verificar que el hook use `useUnifiedClientData` o similar
2. Verificar que haya un filtro `.eq('client_id', currentClientId)`

### Problema: "Redirect Loop Infinito"

**Causa**: Rutas legacy redirigen en ciclo

**Solución**:
1. Revisar `LEGACY_ROUTES` en `routes.ts`
2. Verificar que los redirects usen `replace: true`
3. Asegurar que el destino sea una ruta válida

---

## Agregar Nueva Ruta

### Checklist

1. ✅ Agregar constante en `src/config/routes.ts`
2. ✅ Agregar Route en `src/App.tsx` o `ClientAppWrapper.tsx`
3. ✅ Actualizar navegación (sidebar, menús)
4. ✅ Agregar protección (`ProtectedRoute` si aplica)
5. ✅ Documentar en este archivo
6. ✅ Testear acceso según rol

### Ejemplo: Agregar Nueva Ruta de Backoffice

```typescript
// 1. Agregar a src/config/routes.ts
export const BACKOFFICE_ROUTES = {
  // ...
  NUEVA_SECCION: '/nueva-seccion',
} as const;

// 2. Agregar Route en src/App.tsx (InternalLayout)
<Route 
  path={BACKOFFICE_ROUTES.NUEVA_SECCION} 
  element={
    <ProtectedRoute moduleName="nueva_seccion">
      <Suspense fallback={<TableSkeleton />}>
        <NuevaSeccion />
      </Suspense>
    </ProtectedRoute>
  } 
/>

// 3. Agregar a src/config/sidebar.ts
{
  title: "Nueva Sección",
  url: BACKOFFICE_ROUTES.NUEVA_SECCION,
  icon: IconoNuevo,
  moduleName: "nueva_seccion"
}

// 4. Agregar permisos en /herramientas/accesos
```

---

## Arquitectura Visual

```
┌─────────────────────────────────────────────────────┐
│  App.tsx (BrowserRouter)                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ PUBLIC      │  │ CLIENT APP   │  │ BACKOFFICE ││
│  │ /auth/*     │  │ /client/*    │  │ /*         ││
│  ├─────────────┤  ├──────────────┤  ├────────────┤│
│  │ Login       │  │ Dashboard    │  │ Dashboard  ││
│  │ Callback    │  │ Photos       │  │ Leads      ││
│  │ Reset       │  │ Financial    │  │ Clientes   ││
│  │ Debug       │  │ Chat         │  │ Proyectos  ││
│  │             │  │ Documents    │  │ Gantt      ││
│  │             │  │ Schedule     │  │ ...        ││
│  │             │  │ Appointments │  │            ││
│  │             │  │ Settings     │  │            ││
│  └─────────────┘  └──────────────┘  └────────────┘│
│                                                     │
│  Separación completa • Sin overlap • Claro         │
└─────────────────────────────────────────────────────┘
```

---

## Resumen de Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/config/routes.ts` | **Fuente única de verdad** para todas las rutas |
| `src/App.tsx` | Definición de rutas principales (PUBLIC, CLIENT, BACKOFFICE) |
| `src/layouts/ClientAppWrapper.tsx` | Sub-rutas de `/client/*` |
| `src/config/sidebar.ts` | Items del sidebar del backoffice |
| `src/components/client-app/ClientApp.tsx` | Menú móvil del client app |
| `src/components/client-app/FloatingIslandSidebar.tsx` | Menú desktop del client app |

---

**Última actualización**: 2025-11-06  
**Versión**: 1.0.0

# Integración del Client App en el ERP

## Objetivo

Montar la aplicación cliente (`apps/client`) dentro del ERP en la ruta `/ver-como-cliente` sin imports cruzados. La integración usa redirección + proxy (dev) o build estático (prod).

---

## Arquitectura

```
ERP (puerto 8080)
├── /                    → Dashboard del ERP
├── /clientes            → Módulo de clientes
├── /proyectos           → Módulo de proyectos
└── /ver-como-cliente    → Redirige a /client?preview=1
    └── /client          → Client App (proxy en dev, estático en prod)
```

### Flujo de Navegación

1. Usuario hace clic en "Ver como cliente" en el sidebar del ERP
2. Navega a `/ver-como-cliente`
3. `ClientPreviewHost.tsx` setea localStorage y redirige a `/client?preview=1`
4. El Client App carga con PreviewBar visible

---

## Desarrollo Local

### 1. Iniciar Client App (puerto 5174)

```bash
cd apps/client
npm install
npm run dev -- --port 5174
```

### 2. Iniciar ERP (puerto 8080)

En otra terminal, desde la raíz:

```bash
npm run dev
```

El `vite.config.ts` del ERP tiene un proxy que redirige `/client` → `http://localhost:5174`:

```typescript
server: {
  proxy: {
    '^/client': {
      target: 'http://localhost:5174',
      changeOrigin: true,
    },
  },
}
```

### 3. Acceso

- ERP: `http://localhost:8080`
- Client App directo: `http://localhost:5174`
- Client App vía ERP: `http://localhost:8080/client`

### 4. Preview Mode

Al navegar a `/ver-como-cliente`:

- Se setea `localStorage.clientapp.previewMode = 'true'`
- Se setea `localStorage.clientapp.backofficeUrl = window.location.origin`
- Se redirige a `/client?preview=1`

El Client App detecta `previewMode` y muestra la **PreviewBar** con:
- Selector de clientes
- Toggle Mock/Real data
- Botón "Backoffice" (regresa al ERP)

---

## Producción

### 1. Build del Client App

```bash
cd apps/client
npm run build
```

Genera `apps/client/dist/`.

### 2. Build del ERP

Desde la raíz:

```bash
npm run build
```

El servidor de producción debe servir `apps/client/dist` en la ruta `/client`.

### 3. Configuración del Servidor

#### Opción A: Vite Preview (local)

```bash
npm run preview
```

El `vite.config.ts` puede incluir middleware para servir `/client` desde `apps/client/dist`.

#### Opción B: Nginx

```nginx
server {
  listen 80;
  
  # ERP principal
  location / {
    root /var/www/erp/dist;
    try_files $uri $uri/ /index.html;
  }
  
  # Client App
  location /client {
    alias /var/www/erp/apps/client/dist;
    try_files $uri $uri/ /client/index.html;
  }
}
```

#### Opción C: Vercel/Netlify

**vercel.json**:
```json
{
  "rewrites": [
    { "source": "/client/(.*)", "destination": "/apps/client/dist/$1" }
  ]
}
```

---

## Verificaciones

### ✅ Checklist de Integración

- [ ] `src/pages/ClientPortal.tsx` eliminado
- [ ] `src/pages/portal/Citas.tsx` eliminado
- [ ] No existen imports desde `apps/client/**` en el bundle del ERP
- [ ] `/ver-como-cliente` redirige a `/client?preview=1`
- [ ] En dev: proxy activo en `vite.config.ts`
- [ ] PreviewBar aparece cuando `localStorage.clientapp.previewMode === 'true'`
- [ ] Botón "Backoffice" navega de vuelta al ERP

### 🔍 Testing

#### Dev

```bash
# Terminal 1
cd apps/client && npm run dev -- --port 5174

# Terminal 2
npm run dev

# Navegador
http://localhost:8080/ver-como-cliente
```

**Esperado**: 
- Redirect a `/client?preview=1`
- PreviewBar visible
- Selector de clientes funcional
- Botón "Backoffice" regresa a `/`

#### Prod

```bash
cd apps/client && npm run build
npm run build
npm run preview

# Navegador
http://localhost:4173/ver-como-cliente
```

**Esperado**: Mismo comportamiento que dev

---

## Troubleshooting

### ❌ Error: "Cannot GET /client"

**Causa**: Client app no está corriendo (dev) o no está compilado (prod).

**Solución**:
- **Dev**: `cd apps/client && npm run dev -- --port 5174`
- **Prod**: `cd apps/client && npm run build`

### ❌ PreviewBar no aparece

**Causa**: `localStorage.clientapp.previewMode` no está seteado.

**Solución**: Verifica en DevTools → Application → Local Storage:
```
clientapp.previewMode = "true"
clientapp.backofficeUrl = "http://localhost:8080"
```

### ❌ Página en blanco en /client

**Causa**: Error en algún componente del Client App.

**Solución**: 
1. Abre DevTools → Console
2. Verifica `.env` en `apps/client`:
   ```env
   VITE_SUPABASE_URL=<url>
   VITE_SUPABASE_ANON_KEY=<key>
   VITE_USE_MOCK=false
   ```

### ❌ Botón "Backoffice" no funciona

**Causa**: `localStorage.clientapp.backofficeUrl` no está seteado.

**Solución**: `ClientPreviewHost.tsx` debe setearlo antes de redirect.

---

## Variables de Entorno

### ERP (raíz)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Client App (apps/client)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_USE_MOCK=false
```

**Nota**: Ambos deben apuntar a la misma instancia de Supabase.

---

## Restricciones Críticas

### 🚫 NO hacer

- ❌ Modificar `tsconfig.json` o `tsconfig.app.json` de la raíz
- ❌ Crear alias `@clientapp` en `vite.config.ts`
- ❌ Importar componentes de `apps/client/**` en el ERP
- ❌ Crear clientes Supabase duplicados
- ❌ Modificar autenticación, RLS o policies

### ✅ SÍ hacer

- ✅ Usar redirección con localStorage para comunicar ERP ↔ Client App
- ✅ Mantener ambas apps separadas (sin imports cruzados)
- ✅ Reutilizar el mismo Supabase client en cada app
- ✅ Usar proxy en dev para `/client`
- ✅ Servir `apps/client/dist` estático en prod

---

## Arquitectura de Datos

### Client App

El Client App usa:
- **Vistas Supabase**: `v_client_projects`, `v_client_budget`, etc.
- **Mock data**: Configurable vía `VITE_USE_MOCK=true`
- **RLS**: Policies de Supabase filtran por `client_id`

### ERP

El ERP usa:
- **Tablas directas**: `projects`, `budgets`, `clients`, etc.
- **Admin access**: Políticas RLS para roles admin/staff

**Importante**: No hay comunicación directa entre ERP y Client App. Ambos consumen Supabase de forma independiente.

---

## Notas de Seguridad

- ✅ RLS activo en todas las vistas `v_client_*`
- ✅ Client App solo puede ver datos del `client_id` autenticado
- ✅ Preview mode usa mock data o clientes de prueba (no producción)
- ✅ `localStorage` no almacena datos sensibles (solo flags de UI)
- ✅ Supabase anon key es segura (RLS protege datos)

---

## Roadmap

- [ ] Agregar middleware para fallback si `apps/client/dist` no existe
- [ ] Página de ayuda cuando Client App no está compilado
- [ ] Script automático de build dual (ERP + Client App)
- [ ] Documentar deploy en Vercel/Netlify/Railway
- [ ] CI/CD pipeline para build conjunto

---

## Referencias

- [Client App README](../apps/client/README.md) - Documentación completa de la app cliente
- [ERP Sidebar Config](../src/config/sidebar.ts) - Configuración del sidebar
- [Vite Config](../vite.config.ts) - Proxy y build config

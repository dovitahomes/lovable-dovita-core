# Configuración de Desarrollo - Portal de Clientes

## Arquitectura de Desarrollo

El proyecto Dovita tiene dos aplicaciones React separadas:

1. **ERP (Backoffice)**: `src/` - Puerto 8080
2. **Portal de Clientes**: `apps/client/` - Puerto 5174

## Configuración de Puertos

### ERP (Principal)
- **Puerto de desarrollo**: 8080
- **Vite config**: `vite.config.ts` (raíz)
- **Comando**: `npm run dev`

### Portal de Clientes
- **Puerto de desarrollo**: 5174
- **Vite config**: `apps/client/vite.config.ts`
- **Comando**: `npm run dev:client`

## Modo de Desarrollo

Para desarrollar ambas aplicaciones simultáneamente:

```bash
# Terminal 1 - ERP Principal
npm run dev

# Terminal 2 - Portal de Clientes
npm run dev:client
```

### Proxy en Desarrollo

El ERP tiene un proxy configurado en `vite.config.ts`:

```js
proxy: {
  '^/client': {
    target: 'http://localhost:5174',
    changeOrigin: true,
  },
}
```

Esto permite:
- Acceder al ERP en `http://localhost:8080`
- Acceder al portal de clientes en `http://localhost:8080/client` (proxeado a 5174)
- El botón "Ver como Cliente" funciona correctamente redirigiendo a `/client?preview=1`

## Flujo "Ver como Cliente"

1. Usuario hace clic en "Ver como Cliente" en el sidebar del ERP
2. Se carga `src/pages/VerComoCliente.tsx`
3. Se guarda en localStorage:
   - `clientapp.previewMode = "true"`
   - `clientapp.backofficeUrl = window.location.origin`
4. Se redirige a `/client?preview=1`
5. El proxy de Vite redirige a `http://localhost:5174/client?preview=1`
6. El portal de clientes detecta `?preview=1` y activa el modo preview
7. Se muestra PreviewBar con selector de clientes y botón "Volver al Backoffice"

## Producción

En producción:
- ERP se construye con `npm run build` → `dist/`
- Portal de clientes se construye con `npm run build:client` → `apps/client/dist/`
- Ambos builds se sirven desde el mismo servidor
- Las rutas `/client/*` apuntan a `apps/client/dist/`

## Testing Local del Build

Para probar el build localmente:

```bash
# Build both apps
npm run build:all

# Preview (solo sirve el ERP, el cliente debe configurarse en el servidor)
npm run preview
```

**Nota**: El modo preview de Vite solo sirve el ERP. Para probar el cliente en producción, necesitas configurar un servidor que sirva ambos directorios.

## Troubleshooting

### Error 404 al hacer clic en "Ver como Cliente"

**Causa**: El servidor de desarrollo del portal de clientes no está corriendo.

**Solución**: 
```bash
npm run dev:client
```

### Puerto 5174 ya en uso

**Solución**: 
1. Encuentra el proceso: `lsof -i :5174` (Mac/Linux) o `netstat -ano | findstr :5174` (Windows)
2. Mata el proceso o cambia el puerto en `apps/client/vite.config.ts`

### El proxy no funciona

**Verificar**:
1. El portal de clientes está corriendo en puerto 5174
2. El ERP está corriendo en puerto 8080
3. No hay errores en la consola del terminal del ERP

## Variables de Entorno

Ambas aplicaciones comparten la misma configuración de Supabase:
- `.env` (raíz del proyecto)
- Las variables se cargan automáticamente en ambas apps

## Modo Preview vs Modo Cliente Real

### Modo Preview (`?preview=1`)
- Accesible para colaboradores del ERP
- Muestra PreviewBar con selector de clientes
- Toggle Mock/Real Data
- Botón "Volver al Backoffice"
- Sin autenticación de cliente requerida

### Modo Cliente Real (sin `?preview=1`)
- Requiere login con Magic Link
- Solo ve sus propios proyectos
- Sin PreviewBar
- Protegido por RLS de Supabase


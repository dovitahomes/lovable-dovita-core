# Packages

Esta carpeta contiene los paquetes compartidos del monorepo Dovita.

## Estructura planeada

```
packages/
  ├── shared-types/     # Tipos TypeScript compartidos
  ├── shared-utils/     # Utilidades compartidas
  └── shared-ui/        # Componentes UI compartidos
```

## Uso

Los paquetes aquí definidos pueden ser importados por las apps en `apps/` usando el sistema de workspaces de pnpm.

## Configuración del monorepo

El `package.json` de la raíz debe configurarse como:

```json
{
  "private": true,
  "name": "dovita-monorepo",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:client": "pnpm --filter ./apps/client dev",
    "build:client": "pnpm --filter ./apps/client build"
  }
}
```

**NOTA**: El archivo `package.json` de la raíz está protegido en Lovable y debe modificarse manualmente o con permisos especiales.

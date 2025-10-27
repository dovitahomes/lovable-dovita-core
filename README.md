# Dovita Core

Sistema integral de gestión para proyectos de construcción y arquitectura.

## Datos Mock (Desarrollo)

Para facilitar pruebas end-to-end, el proyecto incluye scripts para sembrar y limpiar datos de prueba.

### Requisitos

Configura las siguientes variables en tu archivo `.env` local:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
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

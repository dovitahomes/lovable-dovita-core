# Dovita Client App - Portal de Clientes

Portal web progresivo (PWA) para que clientes de Dovita visualicen en tiempo real el progreso de sus proyectos de construcción.

---

## 🎯 Modos de Uso

### 1. Modo Cliente (Producción)
- **URL**: `/client`
- **Acceso**: Magic link por email
- **Características**:
  - Clientes ven solo sus proyectos
  - Sin PreviewBar
  - Datos protegidos por RLS
  - Autenticación requerida

### 2. Modo Preview (Colaboradores)
- **URL**: `/client?preview=1`
- **Acceso**: Desde botón "Ver como Cliente" en ERP
- **Características**:
  - PreviewBar superior para:
    - Selector de cliente
    - Toggle Mock/Real Data
    - Botón regreso a Backoffice
  - Requiere rol de colaborador
  - Puede ver cualquier cliente

---

## ✨ Características Principales

- 📱 **Diseño Responsivo**: Tres versiones optimizadas (móvil, tablet, desktop)
- 💬 **Chat en Tiempo Real**: Comunicación directa con el equipo
- 📸 **Galería de Fotos**: Visualización del avance de construcción
- 💰 **Panel Financiero**: Seguimiento de pagos y presupuesto
- 📄 **Gestión Documental**: Acceso a contratos, planos y documentos
- 📅 **Sistema de Citas**: Calendario interactivo con gestión de reuniones
- 🔔 **Notificaciones Push**: Alertas en tiempo real (PWA)
- 🎨 **UI/UX Premium**: Interfaz moderna con animaciones fluidas
- 🌓 **Tema Personalizado**: Sistema de diseño coherente
- ⚡ **Rendimiento Óptimo**: Carga rápida y experiencia fluida
- 🔐 **Autenticación Segura**: Magic link sin contraseñas
- 🛡️ **Seguridad RLS**: Datos protegidos a nivel de base de datos

---

## 🛠 Stack Tecnológico

### Framework y Lenguaje
- **React 18.3.1** - Framework principal
- **TypeScript** - Tipado estático y desarrollo robusto
- **Vite 5.4.19** - Build tool de alto rendimiento

### Routing y Navegación
- **React Router DOM 6.30.1** - Navegación entre páginas

### UI Framework y Componentes
- **Radix UI** - Componentes base accesibles
- **shadcn/ui** - Biblioteca de componentes UI
- **Tailwind CSS** - Framework de estilos utility-first
- **tailwindcss-animate** - Animaciones CSS
- **Framer Motion 12.23.24** - Animaciones avanzadas

### State Management
- **React Context API** - Estado global (ProjectContext, NotificationContext)
- **TanStack Query 5.83.0** - Data fetching y cache

### Forms y Validación
- **React Hook Form 7.61.1** - Gestión de formularios
- **Zod 3.25.76** - Validación de esquemas
- **@hookform/resolvers 3.10.0** - Integración RHF + Zod

### Utilidades
- **date-fns 3.6.0** - Manejo de fechas
- **Lucide React 0.462.0** - Iconos
- **clsx 2.1.1** - Utilidad para clases CSS
- **tailwind-merge 2.6.0** - Merge de clases Tailwind

### PWA y Notificaciones
- **vite-plugin-pwa 1.1.0** - Funcionalidad PWA
- **Sonner 1.7.4** - Toast notifications

### Otros
- **React Day Picker 8.10.1** - Componente de calendario
- **embla-carousel-react 8.6.0** - Carrusel de imágenes
- **Recharts 2.15.4** - Gráficas (para futuro uso)

---

## 🏗 Arquitectura de la Aplicación

### Estructura de Carpetas

```
src/
├── components/
│   ├── ui/                          # Componentes base de shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── calendar.tsx
│   │   └── ... (30+ componentes)
│   │
│   └── client-app/                  # Componentes específicos de la app
│       ├── DovitaHeader.tsx        # Header móvil con logo y navegación
│       ├── DovitaHeaderDesktop.tsx # Header desktop con selector de proyecto
│       ├── FloatingIslandSidebar.tsx # Sidebar flotante para desktop
│       ├── MobileFrame.tsx         # Frame del móvil para vistas móviles
│       ├── ChatHeader.tsx          # Header del chat con info del equipo
│       ├── ChatMessage.tsx         # Componente de mensaje individual
│       ├── ChatInput.tsx           # Input para enviar mensajes
│       ├── AvatarCustomizationDialog.tsx # Modal para personalizar avatar
│       ├── AppointmentCalendar.tsx # Calendario de citas
│       ├── AppointmentCard.tsx     # Tarjeta de cita individual
│       ├── AppointmentModal.tsx    # Modal para crear/editar citas
│       ├── TimePicker.tsx          # Selector de hora
│       ├── PhotoViewer.tsx         # Visor de fotos en modal
│       ├── DocumentViewer.tsx      # Visor de documentos
│       ├── ProjectSelector.tsx     # Selector de proyectos
│       ├── NotificationPanel.tsx   # Panel de notificaciones
│       └── GlobalSearch.tsx        # Búsqueda global
│
├── pages/
│   └── client-app/
│       ├── ClientApp.tsx           # Layout principal móvil
│       ├── ClientAppDesktop.tsx    # Layout principal desktop
│       ├── ResponsiveClientApp.tsx # Wrapper que selecciona layout según breakpoint
│       │
│       ├── Dashboard.tsx           # Vista de inicio móvil
│       ├── DashboardDesktop.tsx    # Vista de inicio desktop
│       ├── ResponsiveDashboard.tsx # Wrapper responsive
│       │
│       ├── Chat.tsx                # Chat móvil
│       ├── ChatDesktop.tsx         # Chat desktop
│       ├── ResponsiveChat.tsx      # Wrapper responsive
│       │
│       ├── Photos.tsx              # Galería móvil
│       ├── PhotosDesktop.tsx       # Galería desktop
│       ├── ResponsivePhotos.tsx    # Wrapper responsive
│       │
│       ├── Financial.tsx           # Panel financiero móvil
│       ├── FinancialDesktop.tsx    # Panel financiero desktop
│       ├── ResponsiveFinancial.tsx # Wrapper responsive
│       │
│       ├── Documents.tsx           # Documentos móvil
│       ├── DocumentsDesktop.tsx    # Documentos desktop
│       ├── ResponsiveDocuments.tsx # Wrapper responsive
│       │
│       ├── Schedule.tsx            # Cronograma móvil
│       ├── ScheduleDesktop.tsx     # Cronograma desktop
│       ├── ResponsiveSchedule.tsx  # Wrapper responsive
│       │
│       ├── Appointments.tsx        # Citas móvil
│       ├── AppointmentsDesktop.tsx # Citas desktop
│       ├── ResponsiveAppointments.tsx # Wrapper responsive
│       │
│       ├── Settings.tsx            # Configuración móvil
│       ├── SettingsDesktop.tsx     # Configuración desktop
│       └── ResponsiveSettings.tsx  # Wrapper responsive
│
├── contexts/
│   ├── ProjectContext.tsx          # Estado de proyectos del cliente
│   └── NotificationContext.tsx     # Estado de notificaciones in-app
│
├── lib/
│   ├── client-data.ts              # Interfaces TypeScript y datos mock
│   ├── project-utils.ts            # Utilidades para cálculos de proyecto
│   └── utils.ts                    # Utilidades generales (cn, formatters)
│
├── hooks/
│   ├── use-mobile.tsx              # Hook para detección de viewport móvil
│   └── use-toast.ts                # Hook para toast notifications
│
├── assets/                          # Imágenes, iconos, avatares
│   ├── logo-dovita.png
│   ├── hero-house.jpg
│   ├── avatar-*.png
│   └── ... (renders, fotos de ejemplo)
│
├── App.tsx                          # Componente raíz con Router
├── main.tsx                         # Entry point
├── index.css                        # Estilos globales y design tokens
└── vite-env.d.ts                    # Tipos de Vite

tailwind.config.ts                   # Configuración de Tailwind
vite.config.ts                       # Configuración de Vite y PWA
```

### Patrón de Diseño Responsive

La aplicación utiliza un **patrón de 3 componentes por funcionalidad** para optimizar la experiencia en diferentes dispositivos:

#### Patrón Implementado

```
[Feature].tsx          → Versión móvil optimizada
[Feature]Desktop.tsx   → Versión desktop/tablet optimizada
Responsive[Feature].tsx → Selector automático basado en breakpoint
```

#### Ejemplo: Dashboard

```tsx
// ResponsiveDashboard.tsx
import { useIsMobile } from "@/hooks/use-mobile";
import Dashboard from "./Dashboard";
import DashboardDesktop from "./DashboardDesktop";

export default function ResponsiveDashboard() {
  const isMobile = useIsMobile();
  return isMobile ? <Dashboard /> : <DashboardDesktop />;
}
```

#### Breakpoint
- **Móvil**: < 768px
- **Desktop/Tablet**: >= 768px

Este patrón se aplica a todos los módulos principales:
- Dashboard
- Chat
- Photos
- Financial
- Documents
- Schedule
- Appointments
- Settings

---

## 📱 Funcionalidades Detalladas

### 1. Dashboard (Inicio)

**Archivos**: `Dashboard.tsx`, `DashboardDesktop.tsx`

El Dashboard es la página principal que muestra un resumen general del proyecto.

#### Componentes Visuales

##### 1.1 Tarjeta de Bienvenida con Hero Image
- **Hero Image**: Imagen principal del proyecto (render o foto de la casa)
- **Navegación de Renders**: Si hay múltiples renders, muestra dots de navegación
- **Información del Cliente**: Nombre y proyecto
- **Ubicación**: Dirección con ícono de mapa

##### 1.2 Fase Actual
- **Barra de Progreso**: Visual con porcentaje
- **Nombre de Fase**: Fase activa del proyecto
- **Click Action**: Navega al cronograma completo

##### 1.3 Resumen Financiero
- **Monto Pagado**: Formateado en millones (M) para construcción, miles (k) para diseño
- **Monto Pendiente**: Mismo formato
- **Barra de Progreso**: Visual del % pagado
- **Click Action**: Navega a página financiera

##### 1.4 Próxima Cita
- **Información Completa**: Fecha, hora, tipo de reunión
- **Team Member**: Avatar, nombre y rol
- **Ubicación**: Con ícono diferenciado (físico/virtual)
- **Click Action**: Navega a citas

##### 1.5 Acciones Rápidas
Botones de navegación directa:
- 📸 Ver Fotos
- 📅 Agendar Cita
- 💬 Mensaje (Chat)
- 📄 Documentos

##### 1.6 Galería de Renders/Fotos Recientes
- **Diseño**: Muestra renders/diseños
- **Construcción**: Muestra fotos de avance
- Máximo 3 imágenes más recientes
- Click para navegar a galería completa

#### Datos del Backend Requeridos

```typescript
// GET /api/projects/{projectId}
{
  id: string;
  clientName: string;
  name: string;
  location: string;
  progress: number;               // 0-100
  currentPhase: string;
  projectStage: 'design' | 'construction';
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  startDate: string;              // ISO 8601
  estimatedEndDate: string;
  heroImage: string;              // URL
  renders: Render[];
  team: TeamMember[];
  phases: Phase[];
  documents: Document[];
}

// GET /api/appointments?projectId={projectId}&status=upcoming&limit=1
{
  id: number;
  type: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  teamMember: TeamMember;
  location: string;
  notes: string;
  isVirtual: boolean;
  meetingLink?: string;
}

// GET /api/photos?projectId={projectId}&limit=3&sort=recent
Photo[]
```

---

### 2. Chat (Mensajería Grupal)

**Archivos**: `Chat.tsx`, `ChatDesktop.tsx`, `ChatHeader.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `AvatarCustomizationDialog.tsx`

Sistema de mensajería en tiempo real entre el cliente y el equipo del proyecto.

#### Características

##### 2.1 Chat Grupal
- **Conversación única** con todo el equipo
- **Agrupación por fecha**: Separadores (Hoy, Ayer, DD/MM/YYYY)
- **Scroll automático** a nuevos mensajes
- **Carga de historial** con scroll infinito

##### 2.2 Mensajes del Cliente
- **Alineación**: Derecha
- **Avatar**: Personalizable (ver 2.4)
- **Estados**: 
  - Enviado ✓
  - Entregado ✓✓
  - Leído ✓✓ (azul)
- **Timestamp**: Formato HH:mm

##### 2.3 Mensajes del Equipo
- **Alineación**: Izquierda
- **Información**: Nombre, rol, avatar
- **Timestamp**: Formato HH:mm

##### 2.4 Personalización de Avatar
- **6 Avatares Predefinidos**: 3 hombres, 3 mujeres
- **Foto Personalizada**: Upload de imagen
- **Persistencia**: localStorage

##### 2.5 Header del Chat
- **Banner de Equipo**: Muestra todos los miembros
- **Ícono Grupal**: Indicador de chat grupal
- **Contador**: Número de miembros

##### 2.6 Input de Mensaje
- **Textarea**: Auto-resize según contenido
- **Botón Enviar**: Con ícono de avión
- **Enter**: Envía mensaje
- **Shift+Enter**: Nueva línea

#### Integración Backend

```typescript
// WebSocket Connection
ws://api.example.com/chat/ws?projectId={id}&clientId={id}

// Eventos WebSocket
{
  type: 'message.new',
  data: ChatMessage
}

{
  type: 'message.status',
  data: {
    messageId: number;
    status: 'delivered' | 'read';
  }
}

// HTTP Endpoints
GET  /api/chat/messages?projectId={id}&limit=50&offset=0
POST /api/chat/messages
     Body: {
       projectId: string;
       content: string;
     }
```

**Interfaz ChatMessage**:
```typescript
{
  id: number;
  projectId: string;
  content: string;
  timestamp: string;              // ISO 8601
  isClient: boolean;
  sender?: {                      // Solo si isClient = false
    name: string;
    avatar: string;               // URL
    role: string;
  };
  status: 'sent' | 'delivered' | 'read';
}
```

---

### 3. Photos (Galería de Avance)

**Archivos**: `Photos.tsx`, `PhotosDesktop.tsx`, `PhotoViewer.tsx`

Galería de fotos del proyecto con filtros por fase de construcción.

#### Características

##### 3.1 Visualización Condicional
- **Fase Diseño**: Mensaje indicando disponibilidad futura
- **Fase Construcción**: Galería completa activa

##### 3.2 Header Informativo
- **Título con Gradiente**: "Fotos del Proyecto"
- **Contador Total**: Número de fotos disponibles
- **Subtítulo**: Descripción contextual

##### 3.3 Filtros por Fase
Tabs de filtro:
- **Todas**: Sin filtro
- **Cimentación**
- **Estructura**
- **Instalaciones**
- **Acabados**
- **Exteriores**

##### 3.4 Tarjetas de Estadísticas
3 tarjetas mostrando:
- Fotos por fase principal
- Total de fotos

##### 3.5 Galería Grid
- **Layout Responsive**:
  - Móvil: 2 columnas
  - Desktop: 3-4 columnas
- **Aspecto Cuadrado**: aspect-square
- **Badge de Fase**: En cada foto
- **Hover Overlay**: Muestra descripción
- **Info Adicional**: Fecha y ubicación

##### 3.6 Visor de Fotos (PhotoViewer)
Modal de visualización:
- **Imagen Fullscreen**
- **Navegación**: Anterior/Siguiente
- **Información**: Fase, fecha, descripción
- **Swipe Gestures**: Móvil
- **Keyboard Navigation**: Desktop (arrows, ESC)

##### 3.7 Empty State
Mensaje cuando filtro no tiene resultados

#### Integración Backend

```typescript
// GET /api/photos?projectId={id}
Photo[]

interface Photo {
  id: number;
  projectId: string;
  url: string;                    // URL de imagen original
  thumbnailUrl?: string;          // URL de thumbnail (optimización)
  phase: string;                  // "Cimentación", "Estructura", etc.
  date: string;                   // ISO 8601
  description: string;
  location?: {
    lat: number;
    lng: number;
  };
  uploadedBy?: {
    name: string;
    role: string;
  };
}

// POST /api/photos (para futuro)
// FormData: file, projectId, phase, description, location
```

---

### 4. Financial (Panel Financiero)

**Archivos**: `Financial.tsx`, `FinancialDesktop.tsx`

Panel completo de seguimiento financiero del proyecto.

#### Características

##### 4.1 Tarjeta Resumen Total
- **Monto Total**: Destacado, grande
- **Moneda**: MXN (configurable)
- **Monto Pagado**: Formateado en M (millones) o k (miles)
- **Monto Pendiente**: Mismo formato
- **Barra de Progreso**: Visual del % pagado

##### 4.2 Ministraciones (Pagos Programados)
Lista completa de pagos:
- **Concepto**: Descripción del pago
- **Fecha**: Formato legible (DD MMM YYYY)
- **Monto**: Formateado con separador de miles
- **Estado con Badge**:
  - 🟢 **Pagado** (verde con ✓)
  - 🟡 **Pendiente** (ámbar con ⏱)
  - ⚪ **Futuro** (gris)

##### 4.3 Presupuesto Ejecutivo por Categorías
Desglose por categoría:
- **Materiales**
- **Mano de Obra**
- **Permisos y Licencias**
- **Diseño**
- **Otros**

Para cada categoría:
- Nombre
- % gastado
- Barra de progreso
- Monto gastado vs presupuestado
- Formato en miles (k)

##### 4.4 Diferenciación por Fase
- **Diseño**: Solo pagos de diseño
- **Construcción**: Presupuesto completo

#### Integración Backend

```typescript
// GET /api/financials/summary?projectId={id}
{
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  currency: string;               // "MXN", "USD", etc.
}

// GET /api/financials/ministraciones?projectId={id}
Ministracion[]

interface Ministracion {
  id: number;
  projectId: string;
  amount: number;
  date: string;                   // ISO 8601
  status: 'paid' | 'pending' | 'future';
  concept: string;
  paymentMethod?: string;
  reference?: string;
  dueDate?: string;               // Para pending/future
}

// GET /api/financials/budget-categories?projectId={id}
BudgetCategory[]

interface BudgetCategory {
  projectId: string;
  name: string;
  budgeted: number;
  spent: number;
  percentage?: number;            // Opcional, calculable en frontend
}
```

---

### 5. Documents (Gestión Documental)

**Archivos**: `Documents.tsx`, `DocumentsDesktop.tsx`, `DocumentViewer.tsx`

Sistema de gestión y visualización de documentos del proyecto.

#### Características

##### 5.1 Tabs por Categoría
5 categorías principales:

1. **👤 Cliente**
   - Escrituras
   - Identificaciones
   - Comprobantes

2. **🏗 Proyecto**
   - Planos arquitectónicos
   - Especificaciones técnicas
   - Memorias de cálculo

3. **⚖️ Legal**
   - Contratos
   - Permisos de construcción
   - Licencias
   - Uso de suelo

4. **🎨 Diseño**
   - Renders
   - Paletas de colores
   - Diseño de interiores
   - Moodboards

5. **🏗️ Construcción**
   - Bitácoras de obra
   - Reportes de avance
   - Certificaciones

##### 5.2 Lista de Documentos
Cada documento muestra:
- **Ícono**: Según tipo (PDF 📄, Imagen 🖼)
- **Nombre**: Nombre del archivo
- **Tamaño**: Formateado (MB, KB)
- **Fecha**: Fecha de carga
- **Acciones**:
  - 👁 Ver (abre visor)
  - ⬇️ Descargar

##### 5.3 Visor de Documentos (DocumentViewer)
Modal de visualización:
- **PDFs**: iframe con visualizador
- **Imágenes**: Visualización directa
- **Botón Descarga**: Siempre disponible
- **Info del Documento**: Metadata

##### 5.4 Empty State
Mensaje personalizado cuando categoría está vacía

#### Integración Backend

```typescript
// GET /api/documents?projectId={id}
Document[]

interface Document {
  id: number;
  name: string;
  size: string;                   // "3.1 MB" o bytes numéricos
  date: string;                   // ISO 8601
  type: 'pdf' | 'image' | 'doc' | 'xls' | 'other';
  category: 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion';
  url: string;                    // URL para visualizar
  downloadUrl?: string;           // URL específica para descarga
  uploadedBy?: {
    name: string;
    role: string;
    date: string;
  };
  mimeType: string;               // "application/pdf", "image/jpeg", etc.
}

// POST /api/documents (para futuro)
// FormData: file, projectId, category, name

// DELETE /api/documents/{documentId}
```

---

### 6. Schedule (Cronograma)

**Archivos**: `Schedule.tsx`, `ScheduleDesktop.tsx`

Timeline visual del proyecto con todas las fases.

#### Características

##### 6.1 Título Dinámico
- **Diseño**: "Cronograma de Diseño"
- **Construcción**: "Cronograma de Construcción"

##### 6.2 Timeline Visual
- **Línea Vertical**: Conecta todas las fases
- **Íconos de Estado**:
  - ✓ Completada (verde)
  - ⏱ En Proceso (azul)
  - ○ Pendiente (gris)

##### 6.3 Tarjetas de Fase
Cada fase muestra:
- **Nombre**: Ej. "Cimentación", "Diseño Conceptual"
- **Fechas**: Inicio - Fin
- **Badge de Estado**: Coloreado según estado
- **Barra de Progreso**: Solo para fases en proceso
- **Porcentaje**: % de avance

##### 6.4 Estados de Fase
- **Completada**: Badge verde, sin barra
- **En Proceso**: Badge azul, con barra animada
- **Pendiente**: Badge gris, sin barra

##### 6.5 Cálculo de Progreso
Progreso general basado en suma ponderada de todas las fases

#### Integración Backend

```typescript
// GET /api/projects/{projectId}/phases
Phase[]

interface Phase {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;               // 0-100
  startDate: string;              // ISO 8601 o texto formateado
  endDate: string;
  estimatedDuration?: number;     // Días
  actualDuration?: number;        // Días (si completada)
  description?: string;
  deliverables?: string[];
}

// PUT /api/projects/{projectId}/phases/{phaseId}
{
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
}
```

---

### 7. Appointments (Citas)

**Archivos**: `Appointments.tsx`, `AppointmentsDesktop.tsx`, `AppointmentCalendar.tsx`, `AppointmentCard.tsx`, `AppointmentModal.tsx`, `TimePicker.tsx`

Sistema completo de gestión de citas y reuniones.

#### Características

##### 7.1 Calendario Interactivo
- **react-day-picker**: Calendario mensual
- **Indicadores**: Días con citas marcados (punto azul)
- **Selección**: Click en día para ver citas
- **Navegación**: Mes anterior/siguiente

##### 7.2 Tarjeta de Próximas Citas
- **Contador**: Número de citas futuras
- **Botón "Ver todas"**: Abre modal con todas las citas

##### 7.3 Lista de Citas del Día
- **Título**: Fecha seleccionada formateada
- **Contador**: Citas del día
- **Tarjetas**: Una por cita

##### 7.4 Tarjeta de Cita (AppointmentCard)
Información completa:
- **Tipo**: "Visita al terreno/obra", "Revisión de avances", etc.
- **Fecha y Hora**: DD MMM YYYY, HH:mm
- **Duración**: En minutos u horas
- **Estado**: Badge coloreado
  - 🟢 Confirmada
  - 🟡 Pendiente
  - ⚫ Completada
  - 🔴 Cancelada
- **Team Member**: Avatar, nombre, rol
- **Ubicación**: Con ícono
  - 📍 Presencial
  - 📹 Virtual
- **Notas**: Descripción adicional
- **Link de Reunión**: Si es virtual
- **Click**: Abre modal de edición

##### 7.5 Modal de Crear/Editar Cita
Formulario completo:
- **Tipo de Cita**: Select con opciones predefinidas
- **Miembro del Equipo**: Select
- **Fecha**: Date picker
- **Hora**: Time picker (intervalos de 15 min)
- **Duración**: Select (15, 30, 45, 60, 90, 120 min)
- **Ubicación**: Input text
- **¿Es Virtual?**: Switch
- **Notas**: Textarea

Features:
- **Pre-llenado**: Al editar, campos se llenan automáticamente
- **Validación**: React Hook Form + Zod
- **Toast**: Confirmación al crear/editar

##### 7.6 Modal de Todas las Citas Futuras
- **Lista Completa**: Todas las citas upcoming
- **Scroll**: Vertical si hay muchas
- **Click**: Abre modal de edición

##### 7.7 FAB (Floating Action Button)
- **Botón Flotante**: Bottom-right
- **Acción**: Crear cita rápida
- **Color**: Secundario
- **Ícono**: +

##### 7.8 Empty States
- **Sin Citas**: Mensaje personalizado
- **Botón**: Crear nueva cita

#### Integración Backend

```typescript
// GET /api/appointments?projectId={id}
Appointment[]

interface Appointment {
  id: number;
  projectId: string;
  type: string;
  date: string;                   // ISO 8601 (solo fecha)
  time: string;                   // HH:mm
  duration: number;               // minutos
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  teamMember: {
    id: number;
    name: string;
    role: string;
    avatar: string;
  };
  location: string;
  notes: string;
  isVirtual: boolean;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/appointments
{
  projectId: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  teamMemberId: number;
  location: string;
  notes: string;
  isVirtual: boolean;
  meetingLink?: string;
}

// PUT /api/appointments/{appointmentId}
// Mismo body que POST

// DELETE /api/appointments/{appointmentId}

// GET /api/appointments/types
// Lista de tipos disponibles
string[]
```

---

### 8. Settings (Configuración)

**Archivos**: `Settings.tsx`, `SettingsDesktop.tsx`

Panel de configuración del usuario y preferencias.

#### Características

##### 8.1 Información del Cliente
- **Nombre del Cliente**
- **Proyecto Actual**
- (Futuro: Edición de perfil)

##### 8.2 Configuración de Notificaciones Push
- **Switch Maestro**: Habilitar/Deshabilitar notificaciones
- **Solicitud de Permiso**: Del navegador
- **Verificación PWA**: Compatibilidad
- **Estados**:
  - ✅ Permiso concedido
  - ❌ Permiso denegado
  - ⏳ Permiso pendiente

##### 8.3 Notificaciones por Categoría
4 switches independientes:
- 💬 **Chat**: Nuevos mensajes
- 📅 **Calendario**: Recordatorios de citas
- 📄 **Documentos**: Nuevos documentos
- 📸 **Fotos**: Nuevas fotos

Solo disponibles si notificaciones están habilitadas

##### 8.4 Almacenamiento Local
- **localStorage**: Preferencias persistentes
- **Sincronización**: Entre sesiones

##### 8.5 Información de Estado
- **Mensajes**: Estado del permiso
- **Instrucciones**: Si permiso denegado

#### Integración Backend

```typescript
// GET /api/users/{userId}/notification-preferences
{
  userId: string;
  pushEnabled: boolean;
  categories: {
    chat: boolean;
    calendar: boolean;
    documents: boolean;
    photos: boolean;
  };
  deviceTokens?: string[];
}

// PUT /api/users/{userId}/notification-preferences
{
  pushEnabled: boolean;
  categories: {
    chat: boolean;
    calendar: boolean;
    documents: boolean;
    photos: boolean;
  };
}

// POST /api/users/{userId}/devices
{
  token: string;
  platform: 'web' | 'ios' | 'android';
  userAgent: string;
}

// DELETE /api/users/{userId}/devices/{deviceToken}
```

---

## 🔄 Contextos y Estado Global

### ProjectContext

**Archivo**: `src/contexts/ProjectContext.tsx`

**Propósito**: Gestionar proyectos del cliente y proyecto activo seleccionado.

#### Estado

```typescript
{
  currentProject: Project | null;
  availableProjects: Project[];
  hasMultipleProjects: boolean;
}
```

#### Funciones

- `setCurrentProject(projectId: string)`: Cambia el proyecto activo
- **Persistencia**: localStorage del proyecto seleccionado

#### Uso

```tsx
import { useProject } from "@/contexts/ProjectContext";

function MyComponent() {
  const { currentProject, setCurrentProject } = useProject();
  // ...
}
```

#### Integración con Backend

```typescript
// GET /api/clients/{clientId}/projects
Project[]
```

---

### NotificationContext

**Archivo**: `src/contexts/NotificationContext.tsx`

**Propósito**: Gestionar notificaciones in-app (no confundir con push notifications).

#### Estado

```typescript
{
  notifications: Notification[];
  unreadCount: number;
}
```

#### Funciones

- `markAsRead(notificationId: string)`: Marca como leída
- `markAllAsRead()`: Marca todas como leídas
- `addNotification(notification)`: Agrega nueva notificación

#### Interfaz Notification

```typescript
{
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  projectId?: string;
  actionUrl?: string;             // URL para navegar
}
```

#### Integración con Backend

```typescript
// GET /api/notifications?userId={id}&read=false
Notification[]

// WebSocket
ws://api.example.com/notifications/ws?userId={id}

// POST /api/notifications/{id}/read
```

---

## 📲 Funcionalidades PWA

### Configuración (vite.config.ts)

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt'],
  manifest: {
    name: 'Dovita - Constructor de Casas',
    short_name: 'Dovita',
    description: 'Plataforma cliente para seguimiento de proyectos',
    theme_color: '#1A5F7A',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/app',
    icons: [
      // Iconos en diferentes tamaños
    ]
  },
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
          }
        }
      }
    ]
  }
})
```

### Service Worker

- **Cache de Assets**: Automático para recursos estáticos
- **Cache de Imágenes**: Estrategia CacheFirst
- **Actualización**: Automática en cada deploy

### Notificaciones Push

#### Requisitos
- **HTTPS**: Obligatorio en producción
- **Service Worker**: Registrado
- **Permiso del Usuario**: Solicitado explícitamente

#### Implementación en Backend

Para implementar notificaciones push, el backend debe usar **Web Push Protocol**.

**Librerías Recomendadas**:
- **Node.js**: `web-push`
- **Python**: `pywebpush`
- **Java**: `webpush-java`
- **PHP**: `minishlink/web-push`

**Generación de VAPID Keys**:
```bash
# Node.js
npx web-push generate-vapid-keys

# Output:
# Public Key: BKxN...
# Private Key: 5J2...
```

**Configurar en Backend**:
```javascript
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:admin@dovita.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
```

**Endpoint para Enviar Notificación**:
```typescript
// POST /api/push/send
{
  userId: string;
  title: string;
  body: string;
  icon?: string;
  data?: {
    url: string;                  // URL para abrir al hacer click
    projectId?: string;
  };
}

// Backend busca device tokens del usuario y envía
async function sendPushNotification(userId, notification) {
  const devices = await getDeviceTokens(userId);
  
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/icon-192x192.png',
    data: notification.data
  });
  
  for (const device of devices) {
    try {
      await webpush.sendNotification(device, payload);
    } catch (error) {
      // Eliminar token si expiró
      if (error.statusCode === 410) {
        await removeDeviceToken(device.id);
      }
    }
  }
}
```

---

## 📐 Interfaces TypeScript

Todas las interfaces están definidas en `src/lib/client-data.ts`.

### Interfaces Principales

```typescript
// Proyecto completo
interface Project {
  id: string;
  clientName: string;
  name: string;
  location: string;
  progress: number;                 // 0-100
  currentPhase: string;
  projectStage: 'design' | 'construction';
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  startDate: string;                // ISO 8601
  estimatedEndDate: string;
  heroImage: string;                // URL
  renders: Render[];
  team: TeamMember[];
  documents: Document[];
  phases: Phase[];
}

// Render o imagen de diseño
interface Render {
  id: number;
  url: string;
  title: string;
  phase: string;
  date: string;                     // ISO 8601
}

// Miembro del equipo
interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;                   // URL
  phone: string;
  email: string;
}

// Documento
interface Document {
  id: number;
  name: string;
  size: string;                     // "3.1 MB"
  date: string;                     // ISO 8601
  type: 'pdf' | 'image' | 'doc' | 'xls' | 'other';
  category: 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion';
  url: string;
  downloadUrl?: string;
  uploadedBy?: {
    name: string;
    role: string;
    date: string;
  };
  mimeType: string;
}

// Fase del proyecto
interface Phase {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;                 // 0-100
  startDate: string;
  endDate: string;
  estimatedDuration?: number;       // días
  actualDuration?: number;          // días
  description?: string;
  deliverables?: string[];
}

// Foto de avance
interface Photo {
  id: number;
  projectId: string;
  url: string;
  thumbnailUrl?: string;
  phase: string;
  date: string;                     // ISO 8601
  description: string;
  location?: {
    lat: number;
    lng: number;
  };
  uploadedBy?: {
    name: string;
    role: string;
  };
}

// Pago programado
interface Ministracion {
  id: number;
  projectId: string;
  amount: number;
  date: string;                     // ISO 8601
  status: 'paid' | 'pending' | 'future';
  concept: string;
  paymentMethod?: string;
  reference?: string;
  dueDate?: string;
}

// Categoría de presupuesto
interface BudgetCategory {
  projectId: string;
  name: string;
  budgeted: number;
  spent: number;
  percentage?: number;
}

// Mensaje de chat
interface ChatMessage {
  id: number;
  projectId: string;
  content: string;
  timestamp: string;                // ISO 8601
  isClient: boolean;
  sender?: {
    name: string;
    avatar: string;
    role: string;
  };
  status: 'sent' | 'delivered' | 'read';
}

// Cita
interface Appointment {
  id: number;
  projectId: string;
  type: string;
  date: string;                     // ISO 8601 (solo fecha)
  time: string;                     // HH:mm
  duration: number;                 // minutos
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  teamMember: {
    id: number;
    name: string;
    role: string;
    avatar: string;
  };
  location: string;
  notes: string;
  isVirtual: boolean;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

// Notificación in-app
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  projectId?: string;
  actionUrl?: string;
}
```

---

## 🔌 Requisitos del Backend/CRM/ERP

### Arquitectura Recomendada

#### 1. API REST
Para operaciones CRUD estándar

**Framework Sugerido**:
- **Node.js**: Express, Fastify, NestJS
- **Python**: FastAPI, Django REST, Flask
- **Java**: Spring Boot
- **PHP**: Laravel, Symfony
- **Ruby**: Ruby on Rails

#### 2. WebSocket o Server-Sent Events
Para actualizaciones en tiempo real (chat, notificaciones)

**Opciones**:
- **WebSocket** (recomendado): Socket.io, ws, Django Channels
- **SSE**: Más simple, unidireccional
- **Long Polling**: Fallback si WebSocket no disponible

#### 3. Autenticación
- **JWT** (JSON Web Tokens)
- **OAuth 2.0** (opcional, para social login futuro)
- **Session-based** (alternativa)

#### 4. CORS
Configurar para permitir dominio del frontend:
```javascript
// Node.js Express
app.use(cors({
  origin: 'https://app.dovita.com',
  credentials: true
}));
```

#### 5. HTTPS
**Obligatorio en producción**

---

### Endpoints Requeridos

#### Autenticación

```
POST /api/auth/login
     Body: { email: string, password: string }
     Response: { token: string, user: User }

POST /api/auth/logout
     Headers: Authorization: Bearer {token}

POST /api/auth/refresh
     Body: { refreshToken: string }
     Response: { token: string }

GET  /api/auth/me
     Headers: Authorization: Bearer {token}
     Response: User
```

#### Clientes

```
GET  /api/clients/{clientId}
     Response: Client

GET  /api/clients/{clientId}/projects
     Response: Project[]
```

#### Proyectos

```
GET  /api/projects/{projectId}
     Response: Project (completo con relaciones)

GET  /api/projects/{projectId}/phases
     Response: Phase[]

PUT  /api/projects/{projectId}/phases/{phaseId}
     Body: { progress: number, status: string }
```

#### Chat

```
GET  /api/chat/messages?projectId={id}&limit={n}&offset={n}
     Response: { messages: ChatMessage[], total: number }

POST /api/chat/messages
     Body: { projectId: string, content: string }
     Response: ChatMessage

WS   ws://api.example.com/chat/ws?projectId={id}&clientId={id}
     Eventos:
       - message.new: Nuevo mensaje
       - message.status: Cambio de estado
```

#### Fotos

```
GET  /api/photos?projectId={id}
     Response: Photo[]

POST /api/photos
     Content-Type: multipart/form-data
     Fields: file, projectId, phase, description, location
     Response: Photo

DELETE /api/photos/{photoId}
```

#### Financiero

```
GET  /api/financials/summary?projectId={id}
     Response: {
       totalAmount: number,
       totalPaid: number,
       totalPending: number,
       currency: string
     }

GET  /api/financials/ministraciones?projectId={id}
     Response: Ministracion[]

GET  /api/financials/budget-categories?projectId={id}
     Response: BudgetCategory[]
```

#### Documentos

```
GET  /api/documents?projectId={id}
     Response: Document[]

POST /api/documents
     Content-Type: multipart/form-data
     Fields: file, projectId, category, name
     Response: Document

GET  /api/documents/{documentId}/download
     Response: File stream

DELETE /api/documents/{documentId}
```

#### Citas

```
GET  /api/appointments?projectId={id}
     Response: Appointment[]

POST /api/appointments
     Body: Appointment (sin id, createdAt, updatedAt)
     Response: Appointment

PUT  /api/appointments/{appointmentId}
     Body: Partial<Appointment>
     Response: Appointment

DELETE /api/appointments/{appointmentId}

GET  /api/appointments/types
     Response: string[]
```

#### Notificaciones

```
GET  /api/notifications?userId={id}&read={boolean}
     Response: Notification[]

POST /api/notifications/{notificationId}/read
     Response: Notification

PUT  /api/notifications/read-all
     Response: { count: number }

GET  /api/users/{userId}/notification-preferences
     Response: {
       pushEnabled: boolean,
       categories: object
     }

PUT  /api/users/{userId}/notification-preferences
     Body: { pushEnabled: boolean, categories: object }

POST /api/users/{userId}/devices
     Body: { token: string, platform: string, userAgent: string }
     Response: { id: string }
```

#### Push Notifications

```
POST /api/push/send
     Body: {
       userId: string,
       title: string,
       body: string,
       icon?: string,
       data?: object
     }

POST /api/push/subscribe
     Body: { subscription: PushSubscription }

DELETE /api/push/unsubscribe
     Body: { endpoint: string }
```

---

### Almacenamiento de Archivos

#### Opciones Recomendadas

1. **Amazon S3**
   - Más popular y escalable
   - Compatible con CloudFront CDN
   - Precios competitivos

2. **Cloudinary**
   - Especializado en imágenes
   - Transformaciones automáticas
   - CDN incluido

3. **Azure Blob Storage**
   - Opción de Microsoft
   - Integración con Azure

4. **Google Cloud Storage**
   - Opción de Google
   - Integración con GCP

#### URLs Firmadas (Signed URLs)

Para seguridad, usar URLs con tiempo de expiración:

```javascript
// Node.js con AWS S3
const s3 = new AWS.S3();
const url = s3.getSignedUrl('getObject', {
  Bucket: 'dovita-files',
  Key: 'documents/plano-arquitectonico.pdf',
  Expires: 3600 // 1 hora
});
```

---

### Base de Datos

#### Esquema Sugerido (Relacional)

**Tablas Principales**:

```sql
-- Clientes
clients (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Proyectos
projects (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  name VARCHAR(255),
  location VARCHAR(255),
  project_stage VARCHAR(50), -- 'design' | 'construction'
  current_phase VARCHAR(100),
  progress INTEGER, -- 0-100
  total_amount DECIMAL(12,2),
  total_paid DECIMAL(12,2),
  start_date DATE,
  estimated_end_date DATE,
  hero_image VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Fases
phases (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR(100),
  status VARCHAR(50), -- 'completed' | 'in-progress' | 'pending'
  progress INTEGER,
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  estimated_duration INTEGER,
  actual_duration INTEGER,
  description TEXT,
  display_order INTEGER
)

-- Miembros del equipo
team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  role VARCHAR(100),
  avatar VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255)
)

-- Relación proyecto-equipo (muchos a muchos)
project_team (
  project_id UUID REFERENCES projects(id),
  team_member_id INTEGER REFERENCES team_members(id),
  PRIMARY KEY (project_id, team_member_id)
)

-- Documentos
documents (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR(255),
  size VARCHAR(50),
  type VARCHAR(50),
  category VARCHAR(50),
  url VARCHAR(500),
  download_url VARCHAR(500),
  mime_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES team_members(id),
  created_at TIMESTAMP
)

-- Fotos
photos (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  phase VARCHAR(100),
  description TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  uploaded_by INTEGER REFERENCES team_members(id),
  created_at TIMESTAMP
)

-- Renders
renders (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  url VARCHAR(500),
  title VARCHAR(255),
  phase VARCHAR(100),
  created_at TIMESTAMP
)

-- Ministraciones
ministraciones (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  amount DECIMAL(12,2),
  date DATE,
  status VARCHAR(50), -- 'paid' | 'pending' | 'future'
  concept VARCHAR(255),
  payment_method VARCHAR(100),
  reference VARCHAR(100),
  due_date DATE
)

-- Categorías de presupuesto
budget_categories (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name VARCHAR(100),
  budgeted DECIMAL(12,2),
  spent DECIMAL(12,2)
)

-- Mensajes de chat
chat_messages (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  content TEXT,
  timestamp TIMESTAMP,
  is_client BOOLEAN,
  sender_id INTEGER REFERENCES team_members(id), -- NULL si is_client = true
  status VARCHAR(50), -- 'sent' | 'delivered' | 'read'
  created_at TIMESTAMP
)

-- Citas
appointments (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  type VARCHAR(100),
  date DATE,
  time VARCHAR(10),
  duration INTEGER,
  status VARCHAR(50), -- 'confirmed' | 'pending' | 'completed' | 'cancelled'
  team_member_id INTEGER REFERENCES team_members(id),
  location VARCHAR(255),
  notes TEXT,
  is_virtual BOOLEAN,
  meeting_link VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Notificaciones
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES clients(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  project_id UUID REFERENCES projects(id),
  action_url VARCHAR(500),
  created_at TIMESTAMP
)

-- Preferencias de notificaciones
notification_preferences (
  user_id UUID REFERENCES clients(id) PRIMARY KEY,
  push_enabled BOOLEAN DEFAULT FALSE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  calendar_enabled BOOLEAN DEFAULT TRUE,
  documents_enabled BOOLEAN DEFAULT TRUE,
  photos_enabled BOOLEAN DEFAULT TRUE
)

-- Tokens de dispositivos
device_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES clients(id),
  token TEXT,
  platform VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP
)
```

---

### Autenticación y Autorización

#### JWT (Recomendado)

**Flujo**:
1. Cliente envía credenciales a `/api/auth/login`
2. Backend valida y genera JWT
3. Cliente guarda token (localStorage o sessionStorage)
4. Cliente incluye token en cada request: `Authorization: Bearer {token}`
5. Backend valida token y extrae `clientId`

**Estructura del JWT**:
```json
{
  "sub": "client-uuid",
  "email": "cliente@example.com",
  "role": "client",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Implementación Node.js**:
```javascript
const jwt = require('jsonwebtoken');

// Generar token
const token = jwt.sign(
  { sub: client.id, email: client.email, role: 'client' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Middleware de validación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

#### Autorización

**Control de Acceso**:
- Cliente solo puede acceder a **sus propios proyectos**
- Validar `projectId` contra `clientId` del token

```javascript
// Middleware de autorización
async function authorizeProject(req, res, next) {
  const projectId = req.params.projectId;
  const clientId = req.user.sub;
  
  const project = await Project.findById(projectId);
  
  if (project.client_id !== clientId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// Uso
app.get('/api/projects/:projectId',
  authenticateToken,
  authorizeProject,
  getProjectHandler
);
```

---

### Tiempo Real

#### Opción 1: WebSocket (Recomendado)

**Ventajas**:
- Bidireccional
- Baja latencia
- Eficiente para chat

**Implementación con Socket.io (Node.js)**:

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: 'https://app.dovita.com',
    credentials: true
  }
});

// Autenticación
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Conexión
io.on('connection', (socket) => {
  const { projectId } = socket.handshake.query;
  
  // Unirse a room del proyecto
  socket.join(`project:${projectId}`);
  
  // Escuchar mensajes
  socket.on('message:send', async (data) => {
    const message = await createMessage({
      projectId,
      content: data.content,
      isClient: socket.user.role === 'client'
    });
    
    // Emitir a todos en el room
    io.to(`project:${projectId}`).emit('message:new', message);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
```

**Frontend**:
```typescript
import io from 'socket.io-client';

const socket = io('https://api.example.com', {
  auth: {
    token: localStorage.getItem('token')
  },
  query: {
    projectId: currentProject.id
  }
});

socket.on('message:new', (message) => {
  // Agregar mensaje al estado
  addMessage(message);
});

socket.emit('message:send', { content: 'Hola' });
```

#### Opción 2: Server-Sent Events (SSE)

**Ventajas**:
- Más simple que WebSocket
- Bueno para notificaciones unidireccionales
- Reconexión automática

**Implementación**:
```javascript
app.get('/api/notifications/stream', authenticateToken, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const clientId = req.user.sub;
  
  // Escuchar eventos de base de datos o Redis
  const listener = (notification) => {
    if (notification.userId === clientId) {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  };
  
  notificationEmitter.on('notification', listener);
  
  req.on('close', () => {
    notificationEmitter.off('notification', listener);
  });
});
```

#### Opción 3: Long Polling (Fallback)

Menos eficiente, pero funciona en todos los navegadores.

---

## ⚙️ Variables de Entorno

### Frontend (.env)

```env
# URL base de la API
VITE_API_BASE_URL=https://api.dovita.com

# URL del WebSocket (si aplica)
VITE_WS_URL=wss://api.dovita.com

# Entorno
VITE_ENVIRONMENT=production

# VAPID Public Key para push notifications
VITE_VAPID_PUBLIC_KEY=BKxN4iYKNI...

# Analytics (opcional)
VITE_GA_ID=G-XXXXXXXXXX
```

### Backend (.env)

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/dovita

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=https://app.dovita.com

# AWS S3 (para archivos)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=dovita-files
AWS_REGION=us-east-1

# Web Push VAPID Keys
VAPID_PUBLIC_KEY=BKxN4iYKNI...
VAPID_PRIVATE_KEY=5J2z1pqXYz...
VAPID_SUBJECT=mailto:admin@dovita.com

# Email (para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@dovita.com
SMTP_PASSWORD=your-email-password

# Puerto del servidor
PORT=3000

# Entorno
NODE_ENV=production
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js**: 18.x o superior
- **npm** o **yarn** o **pnpm**
- **Git**

### Instalación del Frontend

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-empresa/dovita-client-app.git
cd dovita-client-app

# 2. Instalar dependencias
npm install
# o
yarn install
# o
pnpm install

# 3. Crear archivo .env
cp .env.example .env

# 4. Editar .env con tus valores
nano .env

# 5. Iniciar servidor de desarrollo
npm run dev

# La aplicación estará en http://localhost:5173
```

### Build para Producción

```bash
# Crear build optimizado
npm run build

# Los archivos estarán en /dist

# Preview del build (opcional)
npm run preview
```

### Integración con Backend

#### Paso 1: Configurar CORS en Backend

El backend debe permitir peticiones desde el dominio del frontend.

**Ejemplo Node.js/Express**:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

#### Paso 2: Configurar JWT

Implementar autenticación JWT con secret compartido.

#### Paso 3: Implementar Endpoints

Implementar todos los endpoints listados en la sección [Endpoints Requeridos](#endpoints-requeridos).

#### Paso 4: Configurar Almacenamiento

Configurar S3, Cloudinary u otro servicio para archivos.

#### Paso 5: Configurar WebSocket (Opcional pero Recomendado)

Para chat en tiempo real.

#### Paso 6: Configurar Web Push

Generar VAPID keys e implementar envío de notificaciones push.

```bash
# Generar VAPID keys
npx web-push generate-vapid-keys
```

Agregar las keys a `.env` del backend y frontend.

#### Paso 7: Testing

Usar la [checklist de testing](#-testing-del-backend) para verificar cada endpoint.

---

## ✅ Testing del Backend

Checklist completa para verificar integración correcta.

### Autenticación

- [ ] `POST /api/auth/login` funciona y devuelve JWT válido
- [ ] JWT incluye `clientId` y expiración correcta
- [ ] `POST /api/auth/refresh` renueva el token correctamente
- [ ] `POST /api/auth/logout` invalida el token
- [ ] Tokens expirados son rechazados correctamente

### Proyectos

- [ ] `GET /api/clients/{clientId}/projects` devuelve lista de proyectos del cliente
- [ ] `GET /api/projects/{projectId}` devuelve proyecto completo con todas las relaciones (renders, team, documents, phases)
- [ ] Cliente solo puede acceder a sus propios proyectos (403 si intenta acceder a proyecto ajeno)
- [ ] Datos incluyen todas las propiedades requeridas
- [ ] Fechas están en formato ISO 8601
- [ ] URLs de imágenes son accesibles

### Chat

- [ ] `GET /api/chat/messages` devuelve historial completo
- [ ] Paginación funciona correctamente (limit, offset)
- [ ] `POST /api/chat/messages` crea mensaje y lo retorna
- [ ] WebSocket envía mensajes en tiempo real a todos los conectados
- [ ] Estados de mensaje (sent, delivered, read) se actualizan correctamente
- [ ] Mensajes del cliente vs equipo se diferencian correctamente

### Fotos

- [ ] `GET /api/photos` devuelve todas las fotos del proyecto
- [ ] URLs de imágenes son accesibles
- [ ] Filtrado por `projectId` funciona
- [ ] `POST /api/photos` acepta multipart/form-data
- [ ] Imágenes se guardan correctamente en S3/storage
- [ ] Thumbnails se generan automáticamente (opcional pero recomendado)

### Financiero

- [ ] `GET /api/financials/summary` calcula totales correctamente
- [ ] `GET /api/financials/ministraciones` devuelve pagos ordenados por fecha
- [ ] Estados de ministraciones son correctos (paid, pending, future)
- [ ] `GET /api/financials/budget-categories` devuelve categorías con montos correctos
- [ ] Cálculos de porcentajes son precisos

### Documentos

- [ ] `GET /api/documents` devuelve documentos con URLs de descarga válidas
- [ ] Categorías se respetan correctamente
- [ ] `POST /api/documents` sube archivos correctamente
- [ ] URLs firmadas tienen tiempo de expiración razonable (1-24 horas)
- [ ] Diferentes tipos de archivos (PDF, imágenes, etc.) se manejan correctamente

### Cronograma

- [ ] `GET /api/projects/{projectId}/phases` devuelve todas las fases
- [ ] Estados de fase son correctos (completed, in-progress, pending)
- [ ] Progreso de fases es preciso
- [ ] Fechas de inicio/fin son correctas
- [ ] `PUT /api/projects/{projectId}/phases/{phaseId}` actualiza fase correctamente

### Citas

- [ ] `GET /api/appointments` devuelve citas con team members completos
- [ ] `POST /api/appointments` crea cita y retorna datos completos
- [ ] `PUT /api/appointments/{appointmentId}` actualiza cita correctamente
- [ ] `DELETE /api/appointments/{appointmentId}` elimina cita
- [ ] Validación de fechas/horarios funciona (no permite fechas pasadas para nuevas citas)
- [ ] `GET /api/appointments/types` devuelve tipos disponibles

### Notificaciones

- [ ] `GET /api/notifications` devuelve notificaciones del usuario
- [ ] Filtro por `read` funciona correctamente
- [ ] `POST /api/notifications/{id}/read` marca como leída
- [ ] `PUT /api/notifications/read-all` marca todas como leídas
- [ ] Contador de no leídas es preciso

### Preferencias de Notificaciones

- [ ] `GET /api/users/{userId}/notification-preferences` devuelve preferencias
- [ ] `PUT /api/users/{userId}/notification-preferences` actualiza preferencias
- [ ] Preferencias se respetan al enviar notificaciones

### Push Notifications

- [ ] `POST /api/users/{userId}/devices` registra token de dispositivo
- [ ] `POST /api/push/send` envía notificación push correctamente
- [ ] Notificaciones aparecen en el dispositivo
- [ ] Click en notificación abre URL correcta
- [ ] Tokens expirados se eliminan automáticamente

### Autorización

- [ ] Cliente solo puede ver/editar sus propios datos
- [ ] Endpoints protegidos rechazan requests sin token (401)
- [ ] Endpoints protegidos rechazan tokens inválidos (403)
- [ ] Rate limiting está configurado para prevenir abuso

---

## 📦 Deployment

### Frontend

#### Opción 1: Vercel (Recomendado)

**Ventajas**: Deploy automático desde Git, CDN global, SSL gratuito

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variables de entorno en dashboard de Vercel
# https://vercel.com/your-project/settings/environment-variables
```

#### Opción 2: Netlify

**Ventajas**: Deploy automático, funciones serverless, SSL gratuito

```bash
# 1. Instalar Netlify CLI
npm i -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist
```

#### Opción 3: AWS S3 + CloudFront

**Ventajas**: Control total, escalable, integración con AWS

```bash
# 1. Build
npm run build

# 2. Subir a S3
aws s3 sync dist/ s3://dovita-app-bucket --delete

# 3. Invalidar cache de CloudFront
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

#### Opción 4: GitHub Pages

**Ventajas**: Gratis para proyectos públicos

```bash
# 1. Instalar gh-pages
npm i -D gh-pages

# 2. Agregar a package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# 3. Deploy
npm run deploy
```

---

### Backend

#### Opción 1: Heroku

**Ventajas**: Deploy rápido, PostgreSQL incluido, escalable

```bash
# 1. Crear app
heroku create dovita-api

# 2. Agregar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 3. Configurar variables de entorno
heroku config:set JWT_SECRET=your-secret

# 4. Deploy
git push heroku main
```

#### Opción 2: DigitalOcean App Platform

**Ventajas**: Balance precio/features, fácil de usar

1. Conectar repositorio de GitHub
2. Configurar build settings
3. Agregar variables de entorno
4. Deploy automático

#### Opción 3: AWS EC2 + RDS

**Ventajas**: Control total, muy escalable

1. Crear instancia EC2
2. Crear base de datos RDS (PostgreSQL)
3. Configurar security groups
4. Deploy aplicación con PM2/Docker
5. Configurar NGINX como reverse proxy

#### Opción 4: Google Cloud Run

**Ventajas**: Serverless, pago por uso

```bash
# 1. Build imagen Docker
docker build -t gcr.io/your-project/dovita-api .

# 2. Push a Container Registry
docker push gcr.io/your-project/dovita-api

# 3. Deploy
gcloud run deploy dovita-api \
  --image gcr.io/your-project/dovita-api \
  --platform managed \
  --region us-central1
```

---

### Base de Datos

#### Opción 1: Heroku Postgres

**Ventajas**: Incluido con Heroku, fácil setup

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### Opción 2: AWS RDS

**Ventajas**: Escalable, backups automáticos

1. Crear instancia PostgreSQL en RDS
2. Configurar security groups
3. Conectar desde aplicación

#### Opción 3: DigitalOcean Managed Databases

**Ventajas**: Precio competitivo, fácil de usar

1. Crear cluster de PostgreSQL
2. Obtener connection string
3. Configurar en variables de entorno

#### Opción 4: Supabase

**Ventajas**: PostgreSQL + Auth + Storage + Realtime incluidos

1. Crear proyecto en Supabase
2. Usar connection string en aplicación
3. Aprovechar features adicionales (Auth, Storage)

---

### Storage (Archivos)

#### Opción 1: AWS S3

```bash
# Crear bucket
aws s3 mb s3://dovita-files

# Configurar CORS
aws s3api put-bucket-cors --bucket dovita-files --cors-configuration file://cors.json
```

#### Opción 2: Cloudinary

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

---

## 🔒 Seguridad

### Checklist de Seguridad

#### Frontend

- [ ] **HTTPS obligatorio** en producción
- [ ] **Tokens en memoria** o sessionStorage (no en localStorage si posible)
- [ ] **Validación de inputs** antes de enviar al backend
- [ ] **Sanitización de HTML** para prevenir XSS
- [ ] **CSP headers** configurados
- [ ] **No exponer secrets** en código frontend
- [ ] **Rate limiting** en forms (prevenir spam)

#### Backend

- [ ] **HTTPS obligatorio**
- [ ] **JWT con expiración corta** (15-60 min) + refresh token
- [ ] **Validación de todos los inputs** (nunca confiar en frontend)
- [ ] **SQL injection prevention** (usar ORMs o prepared statements)
- [ ] **XSS prevention** (sanitizar outputs HTML)
- [ ] **CSRF protection** (tokens CSRF)
- [ ] **Rate limiting** (express-rate-limit, nginx)
- [ ] **Helmet.js** para headers de seguridad
- [ ] **Secrets management** (variables de entorno, AWS Secrets Manager, Vault)
- [ ] **Logs de auditoría** para acciones críticas
- [ ] **Encriptación de datos sensibles** en BD
- [ ] **Backups regulares** de base de datos
- [ ] **Permisos mínimos** en servicios cloud (least privilege)

### Implementación de Seguridad

#### Headers de Seguridad (Node.js)

```javascript
const helmet = require('helmet');
app.use(helmet());
```

#### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requests por ventana
});

app.use('/api/', limiter);
```

#### Validación de Inputs

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/chat/messages',
  body('content').isLength({ min: 1, max: 5000 }).trim().escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Procesar mensaje
  }
);
```

---

## 🗺 Roadmap

### Fase 1: Mejoras Inmediatas
- [ ] **Edición de Perfil**: Permitir al cliente editar nombre, email, teléfono
- [ ] **Modo Offline**: PWA con cache más agresivo para funcionar sin conexión
- [ ] **Indicadores de Carga**: Skeletons y loaders en todas las vistas
- [ ] **Error Handling**: Páginas de error personalizadas

### Fase 2: Features Adicionales
- [ ] **Multi-idioma**: i18n para inglés y español
- [ ] **Dark Mode**: Tema oscuro
- [ ] **Compartir**: Compartir fotos/documentos vía link temporal
- [ ] **Comentarios**: Comentar en fotos y documentos
- [ ] **Búsqueda Global**: Buscar en chat, documentos, fotos

### Fase 3: Integraciones
- [ ] **Aprobaciones**: Workflow de aprobación de diseños
- [ ] **Firma Electrónica**: DocuSign, Adobe Sign
- [ ] **Video Conferencia**: Integración con Zoom/Google Meet
- [ ] **Pagos en Línea**: Stripe, PayPal para pagos de ministraciones
- [ ] **Calendario Externo**: Sincronización con Google Calendar, Outlook

### Fase 4: Analytics y Reportes
- [ ] **Dashboard Analytics**: Métricas de uso de la app
- [ ] **Reportes Automáticos**: PDFs con resumen mensual
- [ ] **Exportación de Datos**: Permitir exportar fotos, documentos en zip

### Fase 5: Mobile Apps Nativas
- [ ] **iOS App**: React Native o Swift
- [ ] **Android App**: React Native o Kotlin

---

## 📞 Soporte

### ¿Necesitas Ayuda?

**Email**: soporte@dovita.com

**Documentación**: https://docs.dovita.com

**Issues de GitHub**: [GitHub Issues](https://github.com/tu-empresa/dovita-client-app/issues)

### Contribución

Este proyecto es el **frontend** de la plataforma cliente. Para contribuir:

1. **Fork** del repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir **Pull Request**

### Guidelines de Contribución

- Seguir convenciones de código existentes
- Escribir código TypeScript tipado
- Documentar funciones complejas
- Probar cambios antes de PR
- Actualizar documentación si necesario

---

## 📄 Licencia

Este proyecto es propiedad de **[Tu Empresa]**.

Todos los derechos reservados. Uso no autorizado está prohibido.

---

## 🙏 Créditos

### Construido Con

- [React](https://react.dev/) - Framework de UI
- [TypeScript](https://www.typescriptlang.org/) - Lenguaje
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Framework de estilos
- [Radix UI](https://www.radix-ui.com/) - Componentes primitivos
- [shadcn/ui](https://ui.shadcn.com/) - Biblioteca de componentes
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [React Router](https://reactrouter.com/) - Routing
- [date-fns](https://date-fns.org/) - Utilidades de fechas
- [Framer Motion](https://www.framer.com/motion/) - Animaciones
- [Lucide React](https://lucide.dev/) - Iconos
- [React Hook Form](https://react-hook-form.com/) - Formularios
- [Zod](https://zod.dev/) - Validación
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications

### Equipo de Desarrollo

Desarrollado con ❤️ por **[Tu Empresa]**

---

## 📊 Estadísticas del Proyecto

- **Líneas de Código**: ~15,000+
- **Componentes**: 50+
- **Páginas**: 8 módulos principales × 3 versiones (móvil, desktop, responsive) = 24 componentes de página
- **Dependencias**: 40+ paquetes npm
- **TypeScript**: 100% tipado

---

## 🎨 Design System

### Colores Principales

Los colores se definen en `src/index.css` usando variables CSS HSL:

```css
:root {
  --primary: 200 70% 45%;        /* #1A5F7A - Azul principal */
  --secondary: 215 70% 50%;      /* Azul secundario */
  --accent: 160 60% 50%;         /* Verde acento */
  --background: 0 0% 100%;       /* Blanco */
  --foreground: 222 47% 11%;     /* Texto oscuro */
}
```

### Typography

- **Font Family**: System font stack
- **Headings**: font-bold
- **Body**: font-normal
- **Small**: text-sm

### Spacing

Siguiendo escala de Tailwind: 0.25rem × n

### Breakpoints

- **Mobile**: < 768px
- **Tablet/Desktop**: >= 768px

---

## 🚀 Quick Start para Desarrolladores

```bash
# Clone + Install + Run
git clone <repo> && cd dovita-client-app && npm install && npm run dev
```

**La aplicación estará en**: http://localhost:5173/app

---

## 📝 Notas Finales

Esta aplicación es un **frontend completo y funcional** listo para conectarse a un backend/CRM/ERP existente. Todos los datos actualmente se cargan desde `src/lib/client-data.ts` como **mock data** para demostración.

Para hacerla **100% funcional en producción**, necesitas:

1. ✅ **Implementar el backend** con todos los endpoints documentados
2. ✅ **Configurar autenticación** JWT
3. ✅ **Configurar almacenamiento** de archivos (S3, Cloudinary, etc.)
4. ✅ **Implementar WebSocket** para chat en tiempo real
5. ✅ **Configurar Web Push** para notificaciones
6. ✅ **Desplegar** frontend y backend
7. ✅ **Conectar** frontend a backend mediante variables de entorno

---

**¿Preguntas?** Contáctanos en soporte@dovita.com

**Happy Coding! 🚀**
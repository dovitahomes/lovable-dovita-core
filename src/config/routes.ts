/**
 * Configuración Centralizada de Rutas - Dovita Core
 * 
 * Este archivo contiene TODAS las rutas de la aplicación organizadas por contexto.
 * Usar estas constantes en lugar de strings hardcodeados asegura:
 * - Type safety
 * - Mantenibilidad
 * - Claridad en la arquitectura
 * - Refactoring más fácil
 */

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
export const PUBLIC_ROUTES = {
  AUTH_LOGIN: '/auth/login',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_RESET: '/auth/reset',
  AUTH_SETUP_PASSWORD: '/auth/setup-password',
  AUTH: '/auth',
  SIGNUP: '/signup',
  DEBUG: '/debug',
} as const;

// ============================================
// RUTAS CLIENT APP (para clientes finales)
// Base: /client/*
// Acceso: Solo clientes con proyectos asignados
// ============================================
export const CLIENT_APP_ROUTES = {
  // Ruta base
  BASE: '/client',
  
  // Sub-rutas (relativas a /client)
  DASHBOARD: '/client/dashboard',
  PHOTOS: '/client/photos',
  FINANCIAL: '/client/financial',
  CHAT: '/client/chat',
  DOCUMENTS: '/client/documents',
  SCHEDULE: '/client/schedule',
  APPOINTMENTS: '/client/appointments',
  SETTINGS: '/client/settings',
  
  // Nueva sección de proyectos (Client App con Supabase views)
  PROJECTS: '/cliente/proyectos',
  PROJECT_DETAIL: '/cliente/proyectos/:id',
} as const;

// Sub-rutas relativas para usar dentro de ClientAppWrapper
export const CLIENT_APP_RELATIVE_ROUTES = {
  DASHBOARD: 'dashboard',
  PHOTOS: 'photos',
  FINANCIAL: 'financial',
  CHAT: 'chat',
  DOCUMENTS: 'documents',
  SCHEDULE: 'schedule',
  APPOINTMENTS: 'appointments',
  SETTINGS: 'settings',
} as const;

// ============================================
// RUTAS BACKOFFICE (para colaboradores)
// Base: /*
// Acceso: Colaboradores con roles en user_roles
// ============================================
export const BACKOFFICE_ROUTES = {
  // Dashboard
  DASHBOARD: '/',
  
  // Vista especial
  VER_COMO_CLIENTE: '/ver-como-cliente',
  
  // Mi Área (Colaboradores)
  MI_CALENDARIO: '/mi-calendario',
  MIS_CHATS: '/mis-chats',
  
  // CRM
  LEADS: '/leads',
  CLIENTES: '/clientes',
  CLIENTE_DETALLE: '/clientes/:id',

  // Proyectos
  PROYECTOS: '/proyectos',
  PROYECTO_DETALLE: '/proyectos/:id',
  PROYECTO_EQUIPO: '/proyectos/:id/equipo',
  PROYECTO_CHAT: '/proyectos/:id/chat',
  PROYECTO_CALENDARIO: '/proyectos/:id/calendario',
  DISENO: '/diseno',
  
  // Presupuestos
  PRESUPUESTOS: '/presupuestos',
  PRESUPUESTO_PARAMETRICO: '/presupuestos/:id',
  PRESUPUESTO_EJECUTIVO: '/presupuestos/nuevo-ejecutivo',
  
  // Cronograma (Gantt unificado)
  GANTT: '/gantt',
  
  // Construcción
  CONSTRUCCION: '/construccion',
  CONSTRUCCION_DETALLE: '/construccion/:id',
  CONSTRUCCION_ETAPAS: '/construccion/:id/etapas',
  CONSTRUCCION_FOTOS: '/construccion/:id/fotos',
  CONSTRUCCION_MATERIALES: '/construccion/:id/materiales',
  CONSTRUCCION_EQUIPO: '/construccion/:id/equipo',
  CONSTRUCCION_CRONOGRAMA: '/construccion/proyectos/:projectId/cronograma',
  
  // Proveedores y Órdenes de Compra
  PROVEEDORES: '/proveedores',
  ORDENES_COMPRA: '/ordenes-compra',
  
  // Pagos
  LOTES_PAGO: '/lotes-pago',
  LOTE_PAGO_DETALLE: '/lotes-pago/:id',
  
  // Finanzas
  FINANZAS: '/finanzas',
  FINANZAS_TESORERIA: '/finanzas/tesoreria',
  FINANZAS_FACTURACION: '/finanzas/facturacion',
  FINANZAS_REPORTES: '/finanzas/reportes',
  FINANZAS_CONSTRUCCION: '/finanzas/construccion',
  
  // Contabilidad y Comisiones
  CONTABILIDAD: '/contabilidad',
  COMISIONES: '/comisiones',
  COMISIONES_RESUMEN: '/comisiones/resumen',
  COMISIONES_ALIANZAS: '/comisiones/alianzas',
  COMISIONES_COLABORADORES: '/comisiones/colaboradores',
  COMISIONES_CONFIGURACION: '/comisiones/configuracion',
  
  // Herramientas Administrativas
  HERRAMIENTAS_TAREAS: '/herramientas/tareas',
  HERRAMIENTAS_CONTENIDO: '/herramientas/contenido-corporativo',
  HERRAMIENTAS_SUCURSALES: '/herramientas/sucursales',
  HERRAMIENTAS_ALIANZAS: '/herramientas/alianzas',
  HERRAMIENTAS_GESTION_USUARIOS: '/herramientas/gestion-usuarios',
  HERRAMIENTAS_ACCESOS: '/herramientas/accesos',
  HERRAMIENTAS_REGLAS: '/herramientas/reglas',
  HERRAMIENTAS_USUARIOS: '/herramientas/usuarios',
  HERRAMIENTAS_RENDER_DEL_MES: '/herramientas/render-del-mes',
  HERRAMIENTAS_MANUALES: '/herramientas/manuales',
  HERRAMIENTAS_EMAIL_CONFIG: '/herramientas/configuracion-email',
  HERRAMIENTAS_MAILCHIMP_SEATS: '/herramientas/asientos-mailchimp',
  
  // ERP
  ERP_TRANSACTIONS: '/erp/transactions',
  ERP_BUDGETS: '/erp/budgets',
  ERP_BUDGETS_NEW: '/erp/budgets/new',
  ERP_BUDGET_DETAIL: '/erp/budgets/:id',
  
  // Otros
  METRICS: '/metrics',
} as const;

// ============================================
// RUTAS LEGACY (redirects por compatibilidad)
// Estas rutas redirigen a las nuevas
// ============================================
export const LEGACY_ROUTES = {
  // CRM legacy - Opportunities, Accounts, Contacts consolidados en Leads
  OPPORTUNITIES: '/crm/opportunities',
  ACCOUNTS: '/crm/accounts',
  CONTACTS: '/crm/contacts',
  
  // Gantt legacy
  CRONOGRAMA: '/cronograma',
  CRONOGRAMA_PARAMETRICO: '/cronograma-parametrico',
  CONSTRUCCION_GANTT: '/construccion/gantt',
  SCHEDULE: '/schedule',
  LEGACY_SCHEDULE: '/legacy-schedule',
  GANTT_EJECUTIVO: '/gantt-ejecutivo',
  
  // Purchase orders legacy
  CONSTRUCCION_ORDENES: '/construccion/ordenes-compra',
  PURCHASE_INTAKE: '/purchase-intake',
  PURCHASE_BATCH: '/purchase-batch',
  PURCHASE_ORDERS: '/purchase-orders',
  CONSTRUCTION_PURCHASE_ORDERS: '/construction/purchase-orders',
  
  // Finance legacy (redirects eliminados - Finanzas ahora es ruta activa)
  FINANZAS_PAGOS: '/finanzas/pagos-proveedores',
  FINANZAS_PAGO_DETALLE: '/finanzas/pagos-proveedores/:id',
  FINANCE_PAYMENTS: '/finance/payments',
  PAGOS: '/pagos',
  
  // Tools legacy
  HERRAMIENTAS_CATALOGO_TU: '/herramientas/catalogo-tu',
  
  // Usuarios legacy (redirige a Gestión de Usuarios)
  USUARIOS_OLD: '/usuarios',
} as const;

// ============================================
// HELPERS para generar rutas dinámicas
// ============================================
export const generateRoute = {
  // Clientes y CRM
  clienteDetalle: (id: string) => `/clientes/${id}`,

  // Proyectos
  proyectoDetalle: (id: string) => `/proyectos/${id}`,
  proyectoEquipo: (id: string) => `/proyectos/${id}/equipo`,
  proyectoChat: (id: string) => `/proyectos/${id}/chat`, // Legacy - redirige a Mis Chats
  proyectoCalendario: (id: string) => `/proyectos/${id}/calendario`,
  construccionDetalle: (id: string) => `/construccion/${id}`,
  construccionCronograma: (projectId: string) => `/construccion/proyectos/${projectId}/cronograma`,
  
  // Chat centralizado
  misChatsWithProject: (projectId: string) => `/mis-chats?project=${projectId}`,
  
  // Presupuestos
  presupuestoParametrico: (id: string) => `/presupuestos/${id}`,
  
  // Lotes de pago
  lotePagoDetalle: (id: string) => `/lotes-pago/${id}`,
  
  // ERP
  budgetDetail: (id: string) => `/erp/budgets/${id}`,
  
  // Client App con preview
  clientWithPreview: () => '/client?preview=true',
} as const;

// ============================================
// TIPOS (para type safety)
// ============================================
export type PublicRoute = typeof PUBLIC_ROUTES[keyof typeof PUBLIC_ROUTES];
export type ClientAppRoute = typeof CLIENT_APP_ROUTES[keyof typeof CLIENT_APP_ROUTES];
export type BackofficeRoute = typeof BACKOFFICE_ROUTES[keyof typeof BACKOFFICE_ROUTES];
export type LegacyRoute = typeof LEGACY_ROUTES[keyof typeof LEGACY_ROUTES];

export type AppRoute = PublicRoute | ClientAppRoute | BackofficeRoute;

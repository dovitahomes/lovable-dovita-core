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
  
  // CRM
  LEADS: '/leads',
  CLIENTES: '/clientes',
  CLIENTE_DETALLE: '/clientes/:id',
  
  // Proyectos
  PROYECTOS: '/proyectos',
  PROYECTO_DETALLE: '/proyectos/:id',
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
  CONSTRUCCION_CRONOGRAMA: '/construccion/proyectos/:projectId/cronograma',
  
  // Proveedores y Órdenes de Compra
  PROVEEDORES: '/proveedores',
  ORDENES_COMPRA: '/ordenes-compra',
  
  // Pagos
  LOTES_PAGO: '/lotes-pago',
  LOTE_PAGO_DETALLE: '/lotes-pago/:id',
  
  // Contabilidad y Finanzas
  CONTABILIDAD: '/contabilidad',
  COMISIONES: '/comisiones',
  
  // Herramientas Administrativas
  HERRAMIENTAS_CONTENIDO: '/herramientas/contenido-corporativo',
  HERRAMIENTAS_SUCURSALES: '/herramientas/sucursales',
  HERRAMIENTAS_ALIANZAS: '/herramientas/alianzas',
  HERRAMIENTAS_IDENTIDADES: '/herramientas/identidades',
  HERRAMIENTAS_ACCESOS: '/herramientas/accesos',
  HERRAMIENTAS_REGLAS: '/herramientas/reglas',
  HERRAMIENTAS_USUARIOS: '/herramientas/usuarios',
  
  // ERP
  ERP_TRANSACTIONS: '/erp/transactions',
  ERP_BUDGETS: '/erp/budgets',
  ERP_BUDGETS_NEW: '/erp/budgets/new',
  ERP_BUDGET_DETAIL: '/erp/budgets/:id',
  
  // Otros
  USUARIOS: '/usuarios',
  METRICS: '/metrics',
} as const;

// ============================================
// RUTAS LEGACY (redirects por compatibilidad)
// Estas rutas redirigen a las nuevas
// ============================================
export const LEGACY_ROUTES = {
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
  
  // Finance legacy
  FINANZAS: '/finanzas',
  FINANZAS_PAGOS: '/finanzas/pagos-proveedores',
  FINANZAS_PAGO_DETALLE: '/finanzas/pagos-proveedores/:id',
  FINANCE_PAYMENTS: '/finance/payments',
  PAGOS: '/pagos',
  
  // Tools legacy
  HERRAMIENTAS_CATALOGO_TU: '/herramientas/catalogo-tu',
} as const;

// ============================================
// HELPERS para generar rutas dinámicas
// ============================================
export const generateRoute = {
  // Clientes
  clienteDetalle: (id: string) => `/clientes/${id}`,
  
  // Proyectos
  proyectoDetalle: (id: string) => `/proyectos/${id}`,
  construccionDetalle: (id: string) => `/construccion/${id}`,
  construccionCronograma: (projectId: string) => `/construccion/proyectos/${projectId}/cronograma`,
  
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

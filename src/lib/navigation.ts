/**
 * Helpers Tipados para Navegación Segura
 * 
 * Este archivo provee funciones helper con type safety para navegación común.
 * Usar estos helpers en lugar de navigate() directo cuando sea posible.
 */

import { useNavigate } from 'react-router-dom';
import { 
  CLIENT_APP_ROUTES, 
  BACKOFFICE_ROUTES, 
  PUBLIC_ROUTES,
  generateRoute 
} from '@/config/routes';

/**
 * Hook personalizado que provee navegación tipada
 * 
 * @example
 * const nav = useTypedNavigate();
 * nav.toClientDashboard();
 * nav.toClienteDetalle('abc123');
 */
export function useTypedNavigate() {
  const navigate = useNavigate();
  
  return {
    // ============================================
    // CLIENT APP Navigation
    // ============================================
    toClientDashboard: () => navigate(CLIENT_APP_ROUTES.DASHBOARD),
    toClientPhotos: () => navigate(CLIENT_APP_ROUTES.PHOTOS),
    toClientFinancial: () => navigate(CLIENT_APP_ROUTES.FINANCIAL),
    toClientChat: () => navigate(CLIENT_APP_ROUTES.CHAT),
    toClientDocuments: () => navigate(CLIENT_APP_ROUTES.DOCUMENTS),
    toClientSchedule: () => navigate(CLIENT_APP_ROUTES.SCHEDULE),
    toClientAppointments: () => navigate(CLIENT_APP_ROUTES.APPOINTMENTS),
    toClientSettings: () => navigate(CLIENT_APP_ROUTES.SETTINGS),
    toClientWithPreview: () => navigate(generateRoute.clientWithPreview()),
    
    // ============================================
    // BACKOFFICE Navigation
    // ============================================
    toBackofficeDashboard: () => navigate(BACKOFFICE_ROUTES.DASHBOARD),
    toVerComoCliente: () => navigate(BACKOFFICE_ROUTES.VER_COMO_CLIENTE),
    
    // Mi Área
    toMisChats: () => navigate(BACKOFFICE_ROUTES.MIS_CHATS),
    toMisChatsWithProject: (projectId: string) => navigate(generateRoute.misChatsWithProject(projectId)),
    
    // CRM
    toLeads: () => navigate(BACKOFFICE_ROUTES.LEADS),
    toClientes: () => navigate(BACKOFFICE_ROUTES.CLIENTES),
    toClienteDetalle: (id: string) => navigate(generateRoute.clienteDetalle(id)),
    
    // Proyectos
    toProyectos: () => navigate(BACKOFFICE_ROUTES.PROYECTOS),
    toProyectoDetalle: (id: string) => navigate(generateRoute.proyectoDetalle(id)),
    toDiseno: () => navigate(BACKOFFICE_ROUTES.DISENO),
    
    // Presupuestos
    toPresupuestos: () => navigate(BACKOFFICE_ROUTES.PRESUPUESTOS),
    toPresupuestoParametrico: (id: string) => navigate(generateRoute.presupuestoParametrico(id)),
    toPresupuestoEjecutivo: () => navigate(BACKOFFICE_ROUTES.PRESUPUESTO_EJECUTIVO),
    
    // Construcción
    toGantt: () => navigate(BACKOFFICE_ROUTES.GANTT),
    toConstruccion: () => navigate(BACKOFFICE_ROUTES.CONSTRUCCION),
    toConstruccionDetalle: (id: string) => navigate(generateRoute.construccionDetalle(id)),
    toConstruccionCronograma: (projectId: string) => navigate(generateRoute.construccionCronograma(projectId)),
    
    // Finanzas
    toProveedores: () => navigate(BACKOFFICE_ROUTES.PROVEEDORES),
    toOrdenesCompra: () => navigate(BACKOFFICE_ROUTES.ORDENES_COMPRA),
    toLotesPago: () => navigate(BACKOFFICE_ROUTES.LOTES_PAGO),
    toLotePagoDetalle: (id: string) => navigate(generateRoute.lotePagoDetalle(id)),
    toContabilidad: () => navigate(BACKOFFICE_ROUTES.CONTABILIDAD),
    toComisiones: () => navigate(BACKOFFICE_ROUTES.COMISIONES),
    
    // Herramientas
    toHerramientasContenido: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO),
    toHerramientasSucursales: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_SUCURSALES),
    toHerramientasAlianzas: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_ALIANZAS),
    toHerramientasGestionUsuarios: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_GESTION_USUARIOS),
    toHerramientasAccesos: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_ACCESOS),
    toHerramientasReglas: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_REGLAS),
    toHerramientasUsuarios: () => navigate(BACKOFFICE_ROUTES.HERRAMIENTAS_USUARIOS),
    
    // ERP
    toERPTransactions: () => navigate(BACKOFFICE_ROUTES.ERP_TRANSACTIONS),
    toERPBudgets: () => navigate(BACKOFFICE_ROUTES.ERP_BUDGETS),
    toERPBudgetsNew: () => navigate(BACKOFFICE_ROUTES.ERP_BUDGETS_NEW),
    toERPBudgetDetail: (id: string) => navigate(generateRoute.budgetDetail(id)),
    
    // Otros
    toMetrics: () => navigate(BACKOFFICE_ROUTES.METRICS),
    
    // ============================================
    // PUBLIC Navigation
    // ============================================
    toLogin: () => navigate(PUBLIC_ROUTES.AUTH_LOGIN),
    toAuthCallback: () => navigate(PUBLIC_ROUTES.AUTH_CALLBACK),
    toAuthReset: () => navigate(PUBLIC_ROUTES.AUTH_RESET),
    
    // ============================================
    // Generic Navigate (fallback)
    // ============================================
    to: (path: string) => navigate(path),
    toWithState: (path: string, state: any) => navigate(path, { state }),
    replace: (path: string) => navigate(path, { replace: true }),
  };
}

/**
 * Helper para validar si una ruta pertenece al Client App
 */
export function isClientAppRoute(pathname: string): boolean {
  return pathname.startsWith('/client');
}

/**
 * Helper para validar si una ruta es pública
 */
export function isPublicRoute(pathname: string): boolean {
  return Object.values(PUBLIC_ROUTES).some(route => pathname.startsWith(route));
}

/**
 * Helper para obtener la ruta base de un pathname
 * @example getBaseRoute('/clientes/abc123') => '/clientes'
 */
export function getBaseRoute(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : '/';
}

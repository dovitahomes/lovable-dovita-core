import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RequireAdmin } from "@/routes/guards";
import { queryClient } from "@/lib/queryConfig";
import { TabsSkeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/common/Skeletons";
import { DemoGuard } from "@/auth/DemoGuard";
import { ThemeProvider, useTheme } from "@/context/ThemeProvider";
import { SidebarThemeProvider } from "@/context/SidebarThemeProvider";
import { Separator } from "@/components/ui/separator";
import { SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/app/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { PUBLIC_ROUTES, BACKOFFICE_ROUTES, LEGACY_ROUTES } from "@/config/routes";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

// Client App imports
import ClientAppWrapper from "@/layouts/ClientAppWrapper";

// Eager loaded (critical routes)
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Callback from "./pages/auth/Callback";
import ResetPassword from "./pages/auth/ResetPassword";
import SetupPassword from "./pages/auth/SetupPassword";
import NotFound from "./pages/NotFound";
const Debug = lazy(() => import("./pages/Debug"));

// Lazy loaded (code-split by route)
const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteDetalle = lazy(() => import("./pages/ClienteDetalle"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ProyectoDetalle = lazy(() => import("./pages/ProyectoDetalle"));
const ProyectoEquipo = lazy(() => import("./pages/ProyectoEquipo"));
const ProyectoChat = lazy(() => import("./pages/ProyectoChat"));
const ProyectoCalendario = lazy(() => import("./pages/ProyectoCalendario"));
const MisChats = lazy(() => import("./pages/MisChats"));
const MiCalendario = lazy(() => import("./pages/MiCalendario"));
const Leads = lazy(() => import("./pages/Leads"));
const Diseno = lazy(() => import("./pages/Diseno"));
const Presupuestos = lazy(() => import("./pages/Presupuestos"));
const PresupuestoParametrico = lazy(() => import("./pages/PresupuestoParametrico"));
const PresupuestoEjecutivo = lazy(() => import("./pages/PresupuestoEjecutivo"));
const GanttPlan = lazy(() => import("./pages/construction/GanttPlan"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const Construccion = lazy(() => import("./pages/Construccion"));
const ConstruccionEtapas = lazy(() => import("./pages/construccion/ConstruccionEtapas"));
const ConstruccionFotos = lazy(() => import("./pages/construccion/ConstruccionFotos"));
const ConstruccionMateriales = lazy(() => import("./pages/construccion/ConstruccionMateriales"));
const ConstruccionEquipo = lazy(() => import("./pages/construccion/ConstruccionEquipo"));
const OrdenesCompra = lazy(() => import("./pages/OrdenesCompra"));
const Pagos = lazy(() => import("./pages/Pagos"));
const LotesPago = lazy(() => import("./pages/LotesPago"));
const ProjectSchedule = lazy(() => import("./pages/construction/ProjectSchedule"));
const Finanzas = lazy(() => import("./pages/Finanzas"));
const FinanzasTesoreria = lazy(() => import("./pages/finanzas/FinanzasTesoreria"));
const FinanzasFacturacion = lazy(() => import("./pages/finanzas/FinanzasFacturacion"));
const FinanzasReportes = lazy(() => import("./pages/finanzas/FinanzasReportes"));
const FinanzasConstruccion = lazy(() => import("./pages/finanzas/FinanzasConstruccion"));
const PaymentBatchDetail = lazy(() => import("./pages/finance/PaymentBatchDetail"));
const Contabilidad = lazy(() => import("./pages/Contabilidad"));
const Comisiones = lazy(() => import("./pages/Comisiones"));
const ComisionesResumen = lazy(() => import("./pages/comisiones/ComisionesResumen"));
const ComisionesAlianzas = lazy(() => import("./pages/comisiones/ComisionesAlianzas"));
const ComisionesColaboradores = lazy(() => import("./pages/comisiones/ComisionesColaboradores"));
const ComisionesConfiguracion = lazy(() => import("./pages/comisiones/ComisionesConfiguracion"));
const VerComoCliente = lazy(() => import("./pages/VerComoCliente"));

// Admin tools (lazy loaded)
const Tareas = lazy(() => import("./pages/herramientas/Tareas"));
const ContenidoCorporativo = lazy(() => import("./pages/herramientas/ContenidoCorporativo"));
const Sucursales = lazy(() => import("./pages/herramientas/Sucursales"));
const Alianzas = lazy(() => import("./pages/herramientas/Alianzas"));
const GestionUsuarios = lazy(() => import("./pages/herramientas/GestionUsuarios"));
const Accesos = lazy(() => import("./pages/herramientas/Accesos"));
const Reglas = lazy(() => import("./pages/herramientas/Reglas"));
const CatalogoTU = lazy(() => import("./pages/herramientas/CatalogoTU"));
const HerramientasUsuarios = lazy(() => import("./pages/herramientas/Usuarios"));
const EmailConfiguration = lazy(() => import("./pages/admin/EmailConfiguration"));
const MailchimpSeats = lazy(() => import("./pages/admin/MailchimpSeats"));
const Metrics = lazy(() => import("./pages/Metrics"));
const Budgets = lazy(() => import("./pages/erp/Budgets"));
const BudgetWizard = lazy(() => import("./pages/erp/BudgetWizard"));
const BudgetEditor = lazy(() => import("./pages/erp/BudgetEditor"));
const InternalLayout = () => {
  const { theme, toggle: toggleTheme } = useTheme();
  
  // Escuchar notificaciones en tiempo real
  useRealtimeNotifications();
  
  return <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-[5] flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Suspense fallback={<PageHeaderSkeleton />}>
              <Routes>
                {/* ============================================ */}
                {/* DASHBOARD                                    */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.DASHBOARD} element={<Dashboard />} />
                
                {/* ============================================ */}
                {/* MI ÁREA (COLABORADORES)                     */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.MI_CALENDARIO} element={
                  <ProtectedRoute moduleName="proyectos">
                    <Suspense fallback={<TableSkeleton />}><MiCalendario /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.MIS_CHATS} element={
                  <ProtectedRoute moduleName="proyectos">
                    <Suspense fallback={<TableSkeleton />}><MisChats /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* ============================================ */}
                {/* HERRAMIENTAS ADMINISTRATIVAS - SOLO ADMINS */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="contenido_corporativo">
                      <Suspense fallback={<TableSkeleton />}><ContenidoCorporativo /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_SUCURSALES} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="sucursales">
                      <Suspense fallback={<TableSkeleton />}><Sucursales /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_ALIANZAS} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="herramientas">
                      <Suspense fallback={<TableSkeleton />}><Alianzas /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_GESTION_USUARIOS} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="usuarios">
                      <Suspense fallback={<TableSkeleton />}><GestionUsuarios /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_ACCESOS} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="accesos">
                      <Suspense fallback={<TableSkeleton />}><Accesos /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_REGLAS} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="centro_reglas">
                      <Suspense fallback={<TableSkeleton />}><Reglas /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_USUARIOS} element={
                  <ProtectedRoute moduleName="usuarios">
                    <Suspense fallback={<TableSkeleton />}><HerramientasUsuarios /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_EMAIL_CONFIG} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="herramientas">
                      <Suspense fallback={<TableSkeleton />}><EmailConfiguration /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_MAILCHIMP_SEATS} element={
                  <RequireAdmin>
                    <ProtectedRoute moduleName="herramientas">
                      <Suspense fallback={<TableSkeleton />}><MailchimpSeats /></Suspense>
                    </ProtectedRoute>
                  </RequireAdmin>
                } />
                
                {/* ============================================ */}
                {/* ERP MODULES                                  */}
                {/* ============================================ */}
                <Route path={LEGACY_ROUTES.HERRAMIENTAS_CATALOGO_TU} element={<Navigate to={BACKOFFICE_ROUTES.ERP_TRANSACTIONS} replace />} />
                <Route path={BACKOFFICE_ROUTES.ERP_TRANSACTIONS} element={<Suspense fallback={<TableSkeleton />}><CatalogoTU /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.ERP_BUDGETS} element={<Suspense fallback={<TableSkeleton />}><Budgets /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.ERP_BUDGETS_NEW} element={<Suspense fallback={<TableSkeleton />}><BudgetWizard /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.ERP_BUDGET_DETAIL} element={<Suspense fallback={<TableSkeleton />}><BudgetEditor /></Suspense>} />
                
                {/* ============================================ */}
                {/* METRICS - SOLO ADMINS                       */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.METRICS} element={
                  <RequireAdmin>
                    <Suspense fallback={<TableSkeleton />}><Metrics /></Suspense>
                  </RequireAdmin>
                } />
                
                {/* Legacy redirect: old usuarios route */}
                <Route path={LEGACY_ROUTES.USUARIOS_OLD} element={<Navigate to={BACKOFFICE_ROUTES.HERRAMIENTAS_GESTION_USUARIOS} replace />} />
                
                {/* ============================================ */}
                {/* CRM - LEADS Y CLIENTES                      */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.LEADS} element={<Suspense fallback={<TableSkeleton />}><Leads /></Suspense>} />
                
                {/* Legacy redirects - Accounts, Contacts, Opportunities → Leads */}
                <Route path={LEGACY_ROUTES.OPPORTUNITIES} element={<Navigate to={BACKOFFICE_ROUTES.LEADS} replace />} />
                <Route path={LEGACY_ROUTES.ACCOUNTS} element={<Navigate to={BACKOFFICE_ROUTES.LEADS} replace />} />
                <Route path={LEGACY_ROUTES.CONTACTS} element={<Navigate to={BACKOFFICE_ROUTES.LEADS} replace />} />
                <Route path={BACKOFFICE_ROUTES.CLIENTES} element={
                  <ProtectedRoute moduleName="clientes">
                    <Suspense fallback={<TableSkeleton />}><Clientes /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.CLIENTE_DETALLE} element={<Suspense fallback={<TabsSkeleton />}><ClienteDetalle /></Suspense>} />
                
                {/* ============================================ */}
                {/* PROYECTOS Y DISEÑO                          */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.PROYECTOS} element={<Suspense fallback={<TableSkeleton />}><Proyectos /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.PROYECTO_DETALLE} element={<Suspense fallback={<TabsSkeleton />}><ProyectoDetalle /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.PROYECTO_EQUIPO} element={<Suspense fallback={<TableSkeleton />}><ProyectoEquipo /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.PROYECTO_CHAT} element={<Suspense fallback={<TableSkeleton />}><ProyectoChat /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.PROYECTO_CALENDARIO} element={<Suspense fallback={<TableSkeleton />}><ProyectoCalendario /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.DISENO} element={<Suspense fallback={<TableSkeleton />}><Diseno /></Suspense>} />
                
                {/* ============================================ */}
                {/* PRESUPUESTOS                                */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.PRESUPUESTOS} element={<Suspense fallback={<TableSkeleton />}><Presupuestos /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.PRESUPUESTO_EJECUTIVO} element={<Suspense fallback={<TableSkeleton />}><PresupuestoEjecutivo /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.PRESUPUESTO_PARAMETRICO} element={<Suspense fallback={<TableSkeleton />}><PresupuestoParametrico /></Suspense>} />
                
                {/* ============================================ */}
                {/* CRONOGRAMA - GANTT UNIFICADO                */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.GANTT} element={
                  <ProtectedRoute moduleName="cronograma">
                    <Suspense fallback={<TableSkeleton />}><GanttPlan /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Legacy Gantt redirects - mantener por compatibilidad */}
                <Route path={LEGACY_ROUTES.CRONOGRAMA} element={<Navigate to={BACKOFFICE_ROUTES.GANTT} replace />} />
                <Route path={LEGACY_ROUTES.CRONOGRAMA_PARAMETRICO} element={<Navigate to={BACKOFFICE_ROUTES.GANTT} replace />} />
                <Route path={LEGACY_ROUTES.CONSTRUCCION_GANTT} element={<Navigate to={BACKOFFICE_ROUTES.GANTT} replace />} />
                <Route path={LEGACY_ROUTES.SCHEDULE} element={<Navigate to={BACKOFFICE_ROUTES.GANTT} replace />} />
                <Route path={LEGACY_ROUTES.LEGACY_SCHEDULE} element={<Navigate to={BACKOFFICE_ROUTES.GANTT} replace />} />
                <Route path={LEGACY_ROUTES.GANTT_EJECUTIVO} element={<Navigate to={BACKOFFICE_ROUTES.GANTT} replace />} />
                
                {/* ============================================ */}
                {/* CONSTRUCCIÓN                                */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION} element={<Suspense fallback={<TableSkeleton />}><Construccion /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION_DETALLE} element={<Suspense fallback={<TabsSkeleton />}><Construccion /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION_ETAPAS} element={
                  <ProtectedRoute moduleName="construccion">
                    <Suspense fallback={<TabsSkeleton />}><ConstruccionEtapas /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION_FOTOS} element={
                  <ProtectedRoute moduleName="construccion">
                    <Suspense fallback={<TableSkeleton />}><ConstruccionFotos /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION_MATERIALES} element={
                  <ProtectedRoute moduleName="construccion">
                    <Suspense fallback={<TabsSkeleton />}><ConstruccionMateriales /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION_EQUIPO} element={
                  <ProtectedRoute moduleName="construccion">
                    <Suspense fallback={<TableSkeleton />}><ConstruccionEquipo /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.CONSTRUCCION_CRONOGRAMA} element={
                  <ProtectedRoute moduleName="construccion">
                    <Suspense fallback={<TableSkeleton />}><ProjectSchedule /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* ============================================ */}
                {/* PROVEEDORES Y ÓRDENES DE COMPRA            */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.PROVEEDORES} element={
                  <ProtectedRoute moduleName="proveedores">
                    <Suspense fallback={<TableSkeleton />}><Proveedores /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.ORDENES_COMPRA} element={
                  <ProtectedRoute moduleName="ordenes_compra">
                    <Suspense fallback={<TableSkeleton />}><OrdenesCompra /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Legacy redirects para órdenes de compra */}
                <Route path={LEGACY_ROUTES.CONSTRUCCION_ORDENES} element={<Navigate to={BACKOFFICE_ROUTES.ORDENES_COMPRA} replace />} />
                <Route path={LEGACY_ROUTES.PURCHASE_INTAKE} element={<Navigate to={BACKOFFICE_ROUTES.ORDENES_COMPRA} replace />} />
                <Route path={LEGACY_ROUTES.PURCHASE_BATCH} element={<Navigate to={BACKOFFICE_ROUTES.ORDENES_COMPRA} replace />} />
                <Route path={LEGACY_ROUTES.PURCHASE_ORDERS} element={<Navigate to={BACKOFFICE_ROUTES.ORDENES_COMPRA} replace />} />
                <Route path={LEGACY_ROUTES.CONSTRUCTION_PURCHASE_ORDERS} element={<Navigate to={BACKOFFICE_ROUTES.ORDENES_COMPRA} replace />} />
                
                {/* ============================================ */}
                {/* PAGOS Y FINANZAS                            */}
                {/* ============================================ */}
                <Route path={LEGACY_ROUTES.PAGOS} element={<Navigate to={BACKOFFICE_ROUTES.LOTES_PAGO} replace />} />
                <Route path={BACKOFFICE_ROUTES.LOTES_PAGO} element={
                  <ProtectedRoute moduleName="lotes_pago">
                    <Suspense fallback={<TableSkeleton />}><LotesPago /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.LOTE_PAGO_DETALLE} element={
                  <ProtectedRoute moduleName="lotes_pago">
                    <Suspense fallback={<TableSkeleton />}><PaymentBatchDetail /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Legacy finance redirects */}
                <Route path={LEGACY_ROUTES.FINANZAS_PAGOS} element={<Navigate to={BACKOFFICE_ROUTES.LOTES_PAGO} replace />} />
                <Route path={LEGACY_ROUTES.FINANZAS_PAGO_DETALLE} element={<Navigate to={BACKOFFICE_ROUTES.LOTES_PAGO} replace />} />
                <Route path={LEGACY_ROUTES.FINANCE_PAYMENTS} element={<Navigate to={BACKOFFICE_ROUTES.LOTES_PAGO} replace />} />
                
                {/* ============================================ */}
                {/* FINANZAS                                    */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.FINANZAS} element={
                  <ProtectedRoute moduleName="finanzas">
                    <Suspense fallback={<TableSkeleton />}><Finanzas /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.FINANZAS_TESORERIA} element={
                  <ProtectedRoute moduleName="finanzas">
                    <Suspense fallback={<TableSkeleton />}><FinanzasTesoreria /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.FINANZAS_FACTURACION} element={
                  <ProtectedRoute moduleName="finanzas">
                    <Suspense fallback={<TableSkeleton />}><FinanzasFacturacion /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.FINANZAS_REPORTES} element={
                  <ProtectedRoute moduleName="finanzas">
                    <Suspense fallback={<TableSkeleton />}><FinanzasReportes /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.FINANZAS_CONSTRUCCION} element={
                  <ProtectedRoute moduleName="finanzas">
                    <Suspense fallback={<TableSkeleton />}><FinanzasConstruccion /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* ============================================ */}
                {/* CONTABILIDAD Y COMISIONES                   */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.CONTABILIDAD} element={<Suspense fallback={<TabsSkeleton />}><Contabilidad /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.COMISIONES} element={<Suspense fallback={<TabsSkeleton />}><Comisiones /></Suspense>} />
                <Route path={BACKOFFICE_ROUTES.COMISIONES_RESUMEN} element={
                  <ProtectedRoute moduleName="comisiones">
                    <Suspense fallback={<TableSkeleton />}><ComisionesResumen /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.COMISIONES_ALIANZAS} element={
                  <ProtectedRoute moduleName="comisiones">
                    <Suspense fallback={<TableSkeleton />}><ComisionesAlianzas /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.COMISIONES_COLABORADORES} element={
                  <ProtectedRoute moduleName="comisiones">
                    <Suspense fallback={<TableSkeleton />}><ComisionesColaboradores /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path={BACKOFFICE_ROUTES.COMISIONES_CONFIGURACION} element={
                  <ProtectedRoute moduleName="comisiones">
                    <Suspense fallback={<TableSkeleton />}><ComisionesConfiguracion /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* ============================================ */}
                {/* HERRAMIENTAS - TAREAS                       */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_TAREAS} element={<Suspense fallback={<TableSkeleton />}><Tareas /></Suspense>} />
                
                {/* ============================================ */}
                {/* HERRAMIENTAS - Gestión Corporativa          */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO} element={
                  <ProtectedRoute moduleName="contenido_corporativo">
                    <Suspense fallback={<TabsSkeleton />}><ContenidoCorporativo /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Redirects de URLs legacy a Contenido Corporativo */}
                <Route path="/herramientas/render-del-mes" element={<Navigate to={BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO} replace />} />
                <Route path="/herramientas/imagen-auth" element={<Navigate to={BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO} replace />} />
                <Route path="/herramientas/manuales" element={<Navigate to={BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO} replace />} />
                <Route path="/herramientas/promociones" element={<Navigate to={BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO} replace />} />
                
                {/* ============================================ */}
                {/* VER COMO CLIENTE (Preview Mode)             */}
                {/* ============================================ */}
                <Route path={BACKOFFICE_ROUTES.VER_COMO_CLIENTE} element={<Suspense fallback={<TableSkeleton />}><VerComoCliente /></Suspense>} />
                
                {/* ============================================ */}
                {/* 404 - NOT FOUND                             */}
                {/* ============================================ */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
const App = () => {
  return <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <DemoGuard>
                <Routes>
                  {/* ============================================ */}
                  {/* RUTAS PÚBLICAS (sin autenticación)          */}
                  {/* ============================================ */}
                  <Route path={PUBLIC_ROUTES.AUTH_LOGIN} element={<Login />} />
                  <Route path={PUBLIC_ROUTES.DEBUG} element={<Suspense fallback={<PageHeaderSkeleton />}><Debug /></Suspense>} />
                  <Route path={PUBLIC_ROUTES.AUTH_CALLBACK} element={<Callback />} />
                  <Route path={PUBLIC_ROUTES.AUTH_RESET} element={<ResetPassword />} />
                  <Route path={PUBLIC_ROUTES.AUTH_SETUP_PASSWORD} element={<SetupPassword />} />
                  <Route path={PUBLIC_ROUTES.AUTH} element={<Navigate to={PUBLIC_ROUTES.AUTH_LOGIN} replace />} />
                  <Route path={PUBLIC_ROUTES.SIGNUP} element={<Navigate to={PUBLIC_ROUTES.AUTH_LOGIN} replace />} />
                  
                  {/* ============================================ */}
                  {/* CLIENT APP (para clientes finales)          */}
                  {/* Base: /client/* - completamente separado   */}
                  {/* ============================================ */}
                  <Route path="/client/*" element={
                    <ProtectedRoute>
                      <ClientAppWrapper />
                    </ProtectedRoute>
                  } />
                  
                  {/* ============================================ */}
                  {/* BACKOFFICE (para colaboradores)             */}
                  {/* Base: /* - todas las demás rutas           */}
                  {/* ============================================ */}
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <InternalLayout />
                    </ProtectedRoute>
                  } />
                </Routes>
              </DemoGuard>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </SidebarThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>;
};
export default App;
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
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

// Eager loaded (critical routes)
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Callback from "./pages/auth/Callback";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";
const Debug = lazy(() => import("./pages/Debug"));

// Lazy loaded (code-split by route)
const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteDetalle = lazy(() => import("./pages/ClienteDetalle"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ProyectoDetalle = lazy(() => import("./pages/ProyectoDetalle"));
const Leads = lazy(() => import("./pages/Leads"));
const Diseno = lazy(() => import("./pages/Diseno"));
const Presupuestos = lazy(() => import("./pages/Presupuestos"));
const PresupuestoParametrico = lazy(() => import("./pages/PresupuestoParametrico"));
const PresupuestoEjecutivo = lazy(() => import("./pages/PresupuestoEjecutivo"));
const GanttPlan = lazy(() => import("./pages/construction/GanttPlan"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const Construccion = lazy(() => import("./pages/Construccion"));
const OrdenesCompra = lazy(() => import("./pages/OrdenesCompra"));
const Pagos = lazy(() => import("./pages/Pagos"));
const LotesPago = lazy(() => import("./pages/LotesPago"));
const ProjectSchedule = lazy(() => import("./pages/construction/ProjectSchedule"));
const Finanzas = lazy(() => import("./pages/Finanzas"));
const PaymentBatchDetail = lazy(() => import("./pages/finance/PaymentBatchDetail"));
const Contabilidad = lazy(() => import("./pages/Contabilidad"));
const Comisiones = lazy(() => import("./pages/Comisiones"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const ClientPreviewHost = lazy(() => import("./pages/ClientPreviewHost"));

// Admin tools (lazy loaded)
const ContenidoCorporativo = lazy(() => import("./pages/herramientas/ContenidoCorporativo"));
const Sucursales = lazy(() => import("./pages/herramientas/Sucursales"));
const Alianzas = lazy(() => import("./pages/herramientas/Alianzas"));
const Identidades = lazy(() => import("./pages/herramientas/Identidades"));
const Accesos = lazy(() => import("./pages/herramientas/Accesos"));
const Reglas = lazy(() => import("./pages/herramientas/Reglas"));
const CatalogoTU = lazy(() => import("./pages/herramientas/CatalogoTU"));
const HerramientasUsuarios = lazy(() => import("./pages/herramientas/Usuarios"));
const Metrics = lazy(() => import("./pages/Metrics"));
const Budgets = lazy(() => import("./pages/erp/Budgets"));
const BudgetWizard = lazy(() => import("./pages/erp/BudgetWizard"));
const BudgetEditor = lazy(() => import("./pages/erp/BudgetEditor"));
const InternalLayout = () => {
  const { theme, toggle: toggleTheme } = useTheme();
  
  return <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2">
                
                
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Suspense fallback={<PageHeaderSkeleton />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                
                <Route path="/herramientas/contenido-corporativo" element={<Suspense fallback={<TableSkeleton />}><ContenidoCorporativo /></Suspense>} />
                <Route path="/herramientas/sucursales" element={<Suspense fallback={<TableSkeleton />}><Sucursales /></Suspense>} />
                <Route path="/herramientas/alianzas" element={<Suspense fallback={<TableSkeleton />}><Alianzas /></Suspense>} />
                <Route path="/herramientas/identidades" element={<Suspense fallback={<TableSkeleton />}><Identidades /></Suspense>} />
                <Route path="/herramientas/accesos" element={<Suspense fallback={<TableSkeleton />}><Accesos /></Suspense>} />
                <Route path="/herramientas/reglas" element={<Suspense fallback={<TableSkeleton />}><Reglas /></Suspense>} />
                <Route path="/herramientas/catalogo-tu" element={<Navigate to="/erp/transactions" replace />} />
                <Route path="/erp/transactions" element={<Suspense fallback={<TableSkeleton />}><CatalogoTU /></Suspense>} />
                <Route path="/erp/budgets" element={<Suspense fallback={<TableSkeleton />}><Budgets /></Suspense>} />
                <Route path="/erp/budgets/new" element={<Suspense fallback={<TableSkeleton />}><BudgetWizard /></Suspense>} />
                <Route path="/erp/budgets/:id" element={<Suspense fallback={<TableSkeleton />}><BudgetEditor /></Suspense>} />
                <Route path="/herramientas/usuarios" element={<Suspense fallback={<TableSkeleton />}><HerramientasUsuarios /></Suspense>} />
                <Route path="/metrics" element={<Suspense fallback={<TableSkeleton />}><Metrics /></Suspense>} />
                <Route path="/usuarios" element={<Suspense fallback={<TableSkeleton />}><Usuarios /></Suspense>} />
                <Route path="/clientes" element={<Suspense fallback={<TableSkeleton />}><Clientes /></Suspense>} />
                <Route path="/clientes/:id" element={<Suspense fallback={<TabsSkeleton />}><ClienteDetalle /></Suspense>} />
                <Route path="/proyectos" element={<Suspense fallback={<TableSkeleton />}><Proyectos /></Suspense>} />
                <Route path="/proyectos/:id" element={<Suspense fallback={<TabsSkeleton />}><ProyectoDetalle /></Suspense>} />
                <Route path="/leads" element={<Suspense fallback={<TableSkeleton />}><Leads /></Suspense>} />
                <Route path="/diseno" element={<Suspense fallback={<TableSkeleton />}><Diseno /></Suspense>} />
                <Route path="/presupuestos" element={<Suspense fallback={<TableSkeleton />}><Presupuestos /></Suspense>} />
                <Route path="/presupuestos/nuevo-ejecutivo" element={<Suspense fallback={<TableSkeleton />}><PresupuestoEjecutivo /></Suspense>} />
                <Route path="/presupuestos/:id" element={<Suspense fallback={<TableSkeleton />}><PresupuestoParametrico /></Suspense>} />
                
                {/* Unified Gantt route - single route with internal tabs */}
                <Route path="/gantt" element={
                  <ProtectedRoute moduleName="cronograma">
                    <Suspense fallback={<TableSkeleton />}><GanttPlan /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Legacy Gantt redirects - not shown in sidebar but still functional */}
                <Route path="/cronograma" element={<Navigate to="/gantt" replace />} />
                <Route path="/cronograma-parametrico" element={<Navigate to="/gantt" replace />} />
                <Route path="/construccion/gantt" element={<Navigate to="/gantt" replace />} />
                <Route path="/schedule" element={<Navigate to="/gantt" replace />} />
                <Route path="/legacy-schedule" element={<Navigate to="/gantt" replace />} />
                <Route path="/gantt-ejecutivo" element={<Navigate to="/gantt" replace />} />
                
                <Route path="/construccion" element={<Suspense fallback={<TableSkeleton />}><Construccion /></Suspense>} />
                <Route path="/construccion/:id" element={<Suspense fallback={<TabsSkeleton />}><Construccion /></Suspense>} />
                <Route path="/construccion/proyectos/:projectId/cronograma" element={
                  <ProtectedRoute moduleName="construccion">
                    <Suspense fallback={<TableSkeleton />}><ProjectSchedule /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Proveedores y Órdenes de Compra */}
                <Route path="/proveedores" element={
                  <ProtectedRoute moduleName="proveedores">
                    <Suspense fallback={<TableSkeleton />}><Proveedores /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/ordenes-compra" element={
                  <ProtectedRoute moduleName="ordenes_compra">
                    <Suspense fallback={<TableSkeleton />}><OrdenesCompra /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Legacy redirects for purchase orders */}
                <Route path="/construccion/ordenes-compra" element={<Navigate to="/ordenes-compra" replace />} />
                <Route path="/purchase-intake" element={<Navigate to="/ordenes-compra" replace />} />
                <Route path="/purchase-batch" element={<Navigate to="/ordenes-compra" replace />} />
                <Route path="/purchase-orders" element={<Navigate to="/ordenes-compra" replace />} />
                <Route path="/construction/purchase-orders" element={<Navigate to="/ordenes-compra" replace />} />
                <Route path="/pagos" element={<Navigate to="/lotes-pago" replace />} />
                
                {/* Pagos a Proveedores (Lotes de Pago) */}
                <Route path="/lotes-pago" element={
                  <ProtectedRoute moduleName="lotes_pago">
                    <Suspense fallback={<TableSkeleton />}><LotesPago /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/lotes-pago/:id" element={
                  <ProtectedRoute moduleName="lotes_pago">
                    <Suspense fallback={<TableSkeleton />}><PaymentBatchDetail /></Suspense>
                  </ProtectedRoute>
                } />
                
                {/* Legacy finance redirects */}
                <Route path="/finanzas" element={<Navigate to="/contabilidad" replace />} />
                <Route path="/finanzas/pagos-proveedores" element={<Navigate to="/lotes-pago" replace />} />
                <Route path="/finanzas/pagos-proveedores/:id" element={<Navigate to="/lotes-pago" replace />} />
                <Route path="/finance/payments" element={<Navigate to="/lotes-pago" replace />} />
                <Route path="/contabilidad" element={<Suspense fallback={<TabsSkeleton />}><Contabilidad /></Suspense>} />
                <Route path="/comisiones" element={<Suspense fallback={<TabsSkeleton />}><Comisiones /></Suspense>} />
                <Route path="/ver-como-cliente" element={<Suspense fallback={<TableSkeleton />}><ClientPreviewHost /></Suspense>} />
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
                  {/* Public routes */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/debug" element={<Suspense fallback={<PageHeaderSkeleton />}><Debug /></Suspense>} />
                  <Route path="/auth/callback" element={<Callback />} />
                  <Route path="/auth/reset" element={<ResetPassword />} />
                  <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/signup" element={<Navigate to="/auth/login" replace />} />
                  
                  {/* All internal routes - wrapped with ProtectedRoute */}
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
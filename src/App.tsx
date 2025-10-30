import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { queryClient } from "@/lib/queryConfig";
import { TabsSkeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/common/Skeletons";
import { DemoGuard } from "@/auth/DemoGuard";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Separator } from "@/components/ui/separator";
import { SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/app/auth/AuthProvider";

// Eager loaded (critical routes)
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Callback from "./pages/auth/Callback";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

const Debug = lazy(() => import("./pages/Debug"));

// Lazy loaded (code-split by route)
const Clientes = lazy(() => import("./pages/Clientes"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const ProyectoDetalle = lazy(() => import("./pages/ProyectoDetalle"));
const Leads = lazy(() => import("./pages/Leads"));
const Diseno = lazy(() => import("./pages/Diseno"));
const Presupuestos = lazy(() => import("./pages/Presupuestos"));
const PresupuestoParametrico = lazy(() => import("./pages/PresupuestoParametrico"));
const PresupuestoEjecutivo = lazy(() => import("./pages/PresupuestoEjecutivo"));
const Cronograma = lazy(() => import("./pages/Cronograma"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const Construccion = lazy(() => import("./pages/Construccion"));
const Finanzas = lazy(() => import("./pages/Finanzas"));
const Contabilidad = lazy(() => import("./pages/Contabilidad"));
const Comisiones = lazy(() => import("./pages/Comisiones"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Usuarios = lazy(() => import("./pages/Usuarios"));

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

const InternalLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/d5eef59f-dd35-4dc2-9a50-12e8dd8e4c19.png" alt="Logo" className="h-8" />
                <span className="font-semibold text-foreground">Dovita</span>
              </div>
            </div>
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
                <Route path="/herramientas/catalogo-tu" element={<Suspense fallback={<TableSkeleton />}><CatalogoTU /></Suspense>} />
                <Route path="/herramientas/usuarios" element={<Suspense fallback={<TableSkeleton />}><HerramientasUsuarios /></Suspense>} />
                <Route path="/metrics" element={<Suspense fallback={<TableSkeleton />}><Metrics /></Suspense>} />
                <Route path="/usuarios" element={<Suspense fallback={<TableSkeleton />}><Usuarios /></Suspense>} />
                <Route path="/clientes" element={<Suspense fallback={<TableSkeleton />}><Clientes /></Suspense>} />
                <Route path="/proveedores" element={<Suspense fallback={<TableSkeleton />}><Proveedores /></Suspense>} />
                <Route path="/proyectos" element={<Suspense fallback={<TableSkeleton />}><Proyectos /></Suspense>} />
                <Route path="/proyectos/:id" element={<Suspense fallback={<TabsSkeleton />}><ProyectoDetalle /></Suspense>} />
                <Route path="/leads" element={<Suspense fallback={<TableSkeleton />}><Leads /></Suspense>} />
                <Route path="/diseno" element={<Suspense fallback={<TableSkeleton />}><Diseno /></Suspense>} />
                <Route path="/presupuestos" element={<Suspense fallback={<TableSkeleton />}><Presupuestos /></Suspense>} />
                <Route path="/presupuestos/nuevo-ejecutivo" element={<Suspense fallback={<TableSkeleton />}><PresupuestoEjecutivo /></Suspense>} />
                <Route path="/presupuestos/:id" element={<Suspense fallback={<TableSkeleton />}><PresupuestoParametrico /></Suspense>} />
                <Route path="/cronograma" element={<Suspense fallback={<TableSkeleton />}><Cronograma /></Suspense>} />
                <Route path="/construccion/:id" element={<Suspense fallback={<TabsSkeleton />}><Construccion /></Suspense>} />
                <Route path="/finanzas" element={<Suspense fallback={<TabsSkeleton />}><Finanzas /></Suspense>} />
                <Route path="/contabilidad" element={<Suspense fallback={<TabsSkeleton />}><Contabilidad /></Suspense>} />
                <Route path="/comisiones" element={<Suspense fallback={<TabsSkeleton />}><Comisiones /></Suspense>} />
                <Route path="/portal-cliente" element={<Suspense fallback={<TableSkeleton />}><ClientPortal /></Suspense>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
                  
                  {/* All internal routes */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <InternalLayout />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </DemoGuard>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

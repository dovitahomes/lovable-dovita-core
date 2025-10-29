import { Suspense, lazy, useEffect } from "react";
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
import { ViewAsClientToggle } from "@/components/ViewAsClientToggle";
import { shouldUseClientShell } from "@/lib/auth/role";
import { ThemeProvider } from "@/context/ThemeProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarInset } from "@/components/ui/sidebar";
import { useSessionReady } from "@/hooks/useSessionReady";
import { bootstrapUser } from "@/lib/auth/bootstrapUser";

// Eager loaded (critical routes)
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Callback from "./pages/auth/Callback";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

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
const ClientPortalLayout = lazy(() => import("./layouts/ClientPortalLayout"));
const ClientHomeView = lazy(() => import("./pages/client/Home"));
const ClientFinanzas = lazy(() => import("./pages/client/Finanzas"));
const ClientDocumentos = lazy(() => import("./pages/client/Documentos"));
const ClientChat = lazy(() => import("./pages/client/Chat"));
const ClientCalendarioView = lazy(() => import("./pages/client/Calendario"));
const ClientPagosView = lazy(() => import("./pages/client/Payments"));
const Usuarios = lazy(() => import("./pages/Usuarios"));

// Admin tools (lazy loaded)
const ContenidoCorporativo = lazy(() => import("./pages/herramientas/ContenidoCorporativo"));
const Sucursales = lazy(() => import("./pages/herramientas/Sucursales"));
const Alianzas = lazy(() => import("./pages/herramientas/Alianzas"));
const Identidades = lazy(() => import("./pages/herramientas/Identidades"));
const Accesos = lazy(() => import("./pages/herramientas/Accesos"));
const Reglas = lazy(() => import("./pages/herramientas/Reglas"));
const CatalogoTU = lazy(() => import("./pages/herramientas/CatalogoTU"));
const Metrics = lazy(() => import("./pages/Metrics"));

const InternalLayout = () => {
  const { role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect clients to client portal - clients should NEVER see this layout
  useEffect(() => {
    if (role === 'cliente' && !location.pathname.startsWith('/client')) {
      navigate('/client/home', { replace: true });
    }
  }, [role, location.pathname, navigate]);

  // Don't render internal layout for clients at all
  if (role === 'cliente') {
    return null;
  }

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
            <div className="flex items-center gap-2">
              <ViewAsClientToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Suspense fallback={<PageHeaderSkeleton />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                
                <Route
                  path="/herramientas/contenido-corporativo"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <ContenidoCorporativo />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/herramientas/sucursales"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <Sucursales />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/herramientas/alianzas"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <Alianzas />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/herramientas/identidades"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <Identidades />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/herramientas/accesos"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <Accesos />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/herramientas/reglas"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <Reglas />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/herramientas/catalogo-tu"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <CatalogoTU />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/metrics"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TableSkeleton />}>
                        <Metrics />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
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
                <Route
                  path="/contabilidad"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TabsSkeleton />}>
                        <Contabilidad />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/comisiones"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Suspense fallback={<TabsSkeleton />}>
                        <Comisiones />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
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
  const { status, session } = useSessionReady();

  // Bootstrap user profile and role on authentication
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      bootstrapUser();
    }
  }, [status, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DemoGuard>
              <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/auth/reset" element={<ResetPassword />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/login" replace />} />
        
        {/* Client portal routes (isolated, no sidebar) */}
        <Route
          path="/client"
          element={
            <Suspense fallback={<PageHeaderSkeleton />}>
              <ClientPortalLayout />
            </Suspense>
          }
        >
          <Route index element={<Navigate to="/client/home" replace />} />
          <Route path="home" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientHomeView /></Suspense>} />
          <Route path="finanzas" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientFinanzas /></Suspense>} />
          <Route path="documentos" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientDocumentos /></Suspense>} />
          <Route path="docs" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientDocumentos /></Suspense>} />
          <Route path="chat" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientChat /></Suspense>} />
          <Route path="calendario" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientCalendarioView /></Suspense>} />
          <Route path="pagos" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientPagosView /></Suspense>} />
          <Route path="payments" element={<Suspense fallback={<PageHeaderSkeleton />}><ClientPagosView /></Suspense>} />
        </Route>

        {/* Internal admin routes (with sidebar) */}
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
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;


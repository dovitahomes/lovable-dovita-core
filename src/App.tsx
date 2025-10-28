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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/auth/reset" element={<ResetPassword />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/login" replace />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <header className="sticky top-0 z-10 h-14 flex items-center gap-4 border-b bg-background px-4 lg:px-6">
                        <SidebarTrigger />
                        <div className="flex-1" />
                      </header>
                      <main className="flex-1 p-6 lg:p-8">
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
                            <Route path="/usuarios" element={<Suspense fallback={<TableSkeleton />}><Usuarios /></Suspense>} />
                            <Route path="/clientes" element={<Suspense fallback={<TableSkeleton />}><Clientes /></Suspense>} />
                            <Route path="/proveedores" element={<Suspense fallback={<TableSkeleton />}><Proveedores /></Suspense>} />
                            <Route path="/proyectos" element={<Suspense fallback={<TableSkeleton />}><Proyectos /></Suspense>} />
                            <Route path="/proyectos/:id" element={<Suspense fallback={<TabsSkeleton />}><ProyectoDetalle /></Suspense>} />
                            <Route path="/leads" element={<Suspense fallback={<TableSkeleton />}><Leads /></Suspense>} />
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
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

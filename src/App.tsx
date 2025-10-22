import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ContenidoCorporativo from "./pages/herramientas/ContenidoCorporativo";
import Sucursales from "./pages/herramientas/Sucursales";
import Alianzas from "./pages/herramientas/Alianzas";
import Identidades from "./pages/herramientas/Identidades";
import Accesos from "./pages/herramientas/Accesos";
import Reglas from "./pages/herramientas/Reglas";
import CatalogoTU from "./pages/herramientas/CatalogoTU";
import NotFound from "./pages/NotFound";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Proyectos from "./pages/Proyectos";
import ProyectoDetalle from "./pages/ProyectoDetalle";
import Leads from "./pages/Leads";
import Presupuestos from "./pages/Presupuestos";
import PresupuestoParametrico from "./pages/PresupuestoParametrico";
import PresupuestoEjecutivo from "./pages/PresupuestoEjecutivo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
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
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route
                            path="/herramientas/contenido-corporativo"
                            element={
                              <ProtectedRoute requireAdmin>
                                <ContenidoCorporativo />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/herramientas/sucursales"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Sucursales />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/herramientas/alianzas"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Alianzas />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/herramientas/identidades"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Identidades />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/herramientas/accesos"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Accesos />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/herramientas/reglas"
                            element={
                              <ProtectedRoute requireAdmin>
                                <Reglas />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/herramientas/catalogo-tu" element={<ProtectedRoute requireAdmin><CatalogoTU /></ProtectedRoute>} />
                          <Route path="/usuarios" element={<Usuarios />} />
                          <Route path="/clientes" element={<Clientes />} />
                          <Route path="/proyectos" element={<Proyectos />} />
                          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
                          <Route path="/leads" element={<Leads />} />
                          <Route path="/presupuestos" element={<Presupuestos />} />
                          <Route path="/presupuestos/nuevo-ejecutivo" element={<PresupuestoEjecutivo />} />
                          <Route path="/presupuestos/:id" element={<PresupuestoParametrico />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
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

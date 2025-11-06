import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DataSourceProvider } from "@/contexts/DataSourceContext";
import { useAppMode } from "@/hooks/useAppMode";
import { useProjectsData } from "@/hooks/useProjectsData";
import PreviewBar from "@/components/client-app/PreviewBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthStateListener } from "@/components/AuthStateListener";
import ClientLogin from "@/pages/Login";
import NotFound from "./pages/NotFound";
import ResponsiveClientApp from "./pages/client-app/ResponsiveClientApp";
import ResponsiveDashboard from "./pages/client-app/ResponsiveDashboard";
import ResponsivePhotos from "./pages/client-app/ResponsivePhotos";
import ResponsiveFinancial from "./pages/client-app/ResponsiveFinancial";
import ResponsiveChat from "./pages/client-app/ResponsiveChat";
import ResponsiveDocuments from "./pages/client-app/ResponsiveDocuments";
import ResponsiveSchedule from "./pages/client-app/ResponsiveSchedule";
import ResponsiveAppointments from "./pages/client-app/ResponsiveAppointments";
import ResponsiveSettings from "./pages/client-app/ResponsiveSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
});

function AppContent() {
  const { isPreviewMode } = useAppMode();
  const { projects, isLoading, clientName } = useProjectsData();

  // Loading state mientras se cargan los proyectos
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-lg font-medium text-muted-foreground">Cargando tus proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider projects={projects}>
      <AuthStateListener />
      <Toaster />
      <Sonner />
      {isPreviewMode && <PreviewBar />}
      <BrowserRouter basename="/client">
        <Routes>
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/" element={<ProtectedRoute><ResponsiveClientApp /></ProtectedRoute>}>
            <Route index element={<ResponsiveDashboard />} />
            <Route path="photos" element={<ResponsivePhotos />} />
            <Route path="financial" element={<ResponsiveFinancial />} />
            <Route path="chat" element={<ResponsiveChat />} />
            <Route path="documents" element={<ResponsiveDocuments />} />
            <Route path="schedule" element={<ResponsiveSchedule />} />
            <Route path="appointments" element={<ResponsiveAppointments />} />
            <Route path="settings" element={<ResponsiveSettings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataSourceProvider>
      <NotificationProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </NotificationProvider>
    </DataSourceProvider>
  </QueryClientProvider>
);

export default App;

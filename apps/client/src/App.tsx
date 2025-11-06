import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DataSourceProvider } from "@/contexts/DataSourceContext";
import { useAppMode } from "@/hooks/useAppMode";
import { mockClientData } from "@/lib/client-data";
import PreviewBar from "@/components/client-app/PreviewBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

  return (
    <>
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
    </>
  );
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataSourceProvider>
      <ProjectProvider projects={mockClientData.projects}>
        <NotificationProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </NotificationProvider>
      </ProjectProvider>
    </DataSourceProvider>
  </QueryClientProvider>
);

export default App;

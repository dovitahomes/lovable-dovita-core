import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DataSourceProvider } from "@/contexts/DataSourceContext";
import { mockClientData } from "@/lib/client-data";
import PreviewBar from "@/components/client-app/PreviewBar";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataSourceProvider>
      <ProjectProvider projects={mockClientData.projects}>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PreviewBar />
            <BrowserRouter basename="/client">
            <Routes>
              <Route path="/" element={<ResponsiveClientApp />}>
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
        </TooltipProvider>
      </NotificationProvider>
    </ProjectProvider>
    </DataSourceProvider>
  </QueryClientProvider>
);

export default App;

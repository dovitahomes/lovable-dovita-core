import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClientApp from "./pages/client-app/ClientApp";
import Dashboard from "./pages/client-app/Dashboard";
import Photos from "./pages/client-app/Photos";
import Financial from "./pages/client-app/Financial";
import Chat from "./pages/client-app/Chat";
import Documents from "./pages/client-app/Documents";
import Schedule from "./pages/client-app/Schedule";
import Appointments from "./pages/client-app/Appointments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<ClientApp />}>
            <Route index element={<Dashboard />} />
            <Route path="photos" element={<Photos />} />
            <Route path="financial" element={<Financial />} />
            <Route path="chat" element={<Chat />} />
            <Route path="documents" element={<Documents />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="appointments" element={<Appointments />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

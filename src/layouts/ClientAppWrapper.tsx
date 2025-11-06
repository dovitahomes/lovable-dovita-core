import { Routes, Route, Navigate } from 'react-router-dom';
import { DataSourceProvider } from '@/contexts/client-app/DataSourceContext';
import { ProjectProvider } from '@/contexts/client-app/ProjectContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useAppMode } from '@/hooks/client-app/useAppMode';
import { useProjectsData } from '@/hooks/client-app/useProjectsData';
import { AuthStateListener } from '@/components/client-app/AuthStateListener';
import ResponsiveClientApp from '@/pages/client-app/ResponsiveClientApp';
import ResponsiveDashboard from '@/pages/client-app/ResponsiveDashboard';
import ResponsivePhotos from '@/pages/client-app/ResponsivePhotos';
import ResponsiveFinancial from '@/pages/client-app/ResponsiveFinancial';
import ResponsiveChat from '@/pages/client-app/ResponsiveChat';
import ResponsiveDocuments from '@/pages/client-app/ResponsiveDocuments';
import ResponsiveSchedule from '@/pages/client-app/ResponsiveSchedule';
import ResponsiveAppointments from '@/pages/client-app/ResponsiveAppointments';
import ResponsiveSettings from '@/pages/client-app/ResponsiveSettings';

function ClientAppContent() {
  const { isPreviewMode } = useAppMode();
  const { projects, isLoading } = useProjectsData();

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
      <Routes>
        <Route element={<ResponsiveClientApp />}>
          <Route index element={<ResponsiveDashboard />} />
          <Route path="dashboard" element={<ResponsiveDashboard />} />
          <Route path="photos" element={<ResponsivePhotos />} />
          <Route path="financial" element={<ResponsiveFinancial />} />
          <Route path="chat" element={<ResponsiveChat />} />
          <Route path="documents" element={<ResponsiveDocuments />} />
          <Route path="schedule" element={<ResponsiveSchedule />} />
          <Route path="appointments" element={<ResponsiveAppointments />} />
          <Route path="settings" element={<ResponsiveSettings />} />
        </Route>
      </Routes>
    </ProjectProvider>
  );
}

export default function ClientAppWrapper() {
  return (
    <DataSourceProvider>
      <NotificationProvider>
        <ClientAppContent />
      </NotificationProvider>
    </DataSourceProvider>
  );
}

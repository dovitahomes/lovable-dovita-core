import { useEffect } from "react";

// Import client app CSS
import "../../apps/client/src/index.css";

// Import client app components using relative paths
import ResponsiveClientApp from "../../apps/client/src/pages/client-app/ResponsiveClientApp";
import PreviewBar from "../../apps/client/src/components/client-app/PreviewBar";
import { ProjectProvider } from "../../apps/client/src/contexts/ProjectContext";
import { NotificationProvider } from "../../apps/client/src/contexts/NotificationContext";

export default function ClientPreviewHost() {
  useEffect(() => {
    // Set preview mode in localStorage
    localStorage.setItem("clientapp.previewMode", "true");
    localStorage.setItem("clientapp.backofficeUrl", window.location.origin);
  }, []);

  return (
    <div className="client-preview-wrapper">
      <NotificationProvider>
        <ProjectProvider projects={[]}>
          <PreviewBar />
          <ResponsiveClientApp />
        </ProjectProvider>
      </NotificationProvider>
    </div>
  );
}

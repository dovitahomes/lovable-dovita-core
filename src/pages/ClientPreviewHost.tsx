import { useEffect } from "react";

export default function ClientPreviewHost() {
  useEffect(() => {
    // Set preview mode in localStorage
    localStorage.setItem("clientapp.previewMode", "true");
    localStorage.setItem("clientapp.backofficeUrl", window.location.origin);

    // Redirect to client app (must be built and served at /client)
    // In dev: run apps/client separately or configure proxy
    // In prod: build apps/client and serve at /client path
    window.location.href = "/client?preview=1";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Redirigiendo al Portal Cliente...</p>
      </div>
    </div>
  );
}

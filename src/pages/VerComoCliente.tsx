import { useEffect } from "react";

export default function VerComoCliente() {
  useEffect(() => {
    // Set preview mode in localStorage
    localStorage.setItem("clientapp.previewMode", "true");
    localStorage.setItem("clientapp.backofficeUrl", window.location.origin);

    // Redirect to client app
    // In development: proxy to apps/client dev server
    // In production: served from apps/client/dist
    const clientUrl = `${window.location.origin}/client?preview=1`;
    window.location.href = clientUrl;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-lg font-medium text-muted-foreground">Cargando vista de cliente...</p>
        <p className="text-sm text-muted-foreground">Redirigiendo a /client...</p>
      </div>
    </div>
  );
}

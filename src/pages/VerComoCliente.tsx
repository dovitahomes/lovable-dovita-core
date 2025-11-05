import { useEffect } from "react";

export default function VerComoCliente() {
  useEffect(() => {
    // Set preview mode in localStorage
    localStorage.setItem("clientapp.previewMode", "true");
    localStorage.setItem("clientapp.backofficeUrl", window.location.origin);

    // Redirect to client app (apps/client build should be served at /client)
    // In dev, you can run apps/client separately on another port
    // In production, build apps/client and serve it at /client path
    const clientAppUrl = "/client?preview=1";
    window.location.href = clientAppUrl;
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

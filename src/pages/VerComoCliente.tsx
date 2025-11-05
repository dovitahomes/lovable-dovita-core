import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function VerComoCliente() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set preview mode in localStorage
    localStorage.setItem("clientapp.previewMode", "true");
    localStorage.setItem("clientapp.backofficeUrl", window.location.origin);

    // Navigate to client app with preview param
    // Try to navigate to /client first (if built and deployed)
    // Fallback: show a message that clientapp needs to be compiled
    const clientAppUrl = "/client?preview=1";
    
    // Check if /client exists by attempting navigation
    // For now, we'll just try to navigate - if it fails, user will see 404
    window.location.href = clientAppUrl;
  }, [navigate]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Redirigiendo al Portal Cliente</CardTitle>
          <CardDescription>
            Preparando vista previa...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function VerComoCliente() {
  const navigate = useNavigate();

  useEffect(() => {
    // Activar modo preview en localStorage
    localStorage.setItem("clientapp.previewMode", "true");
    
    // LIMPIAR estado previo para forzar re-inicialización
    localStorage.removeItem("clientapp.useMock");
    localStorage.removeItem("clientapp.forceClientId");
    localStorage.removeItem("currentProjectId");
    
    // Guardar URL del backoffice para el botón de regreso
    const currentPath = window.location.pathname;
    const backofficeUrl = currentPath === "/ver-como-cliente" ? "/" : currentPath;
    localStorage.setItem("clientapp.backofficeUrl", backofficeUrl);
    
    // Redirigir a Client App con parámetro preview usando React Router v6
    navigate({
      pathname: "/client",
      search: "?preview=true"
    }, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="text-center space-y-4">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-lg font-medium text-muted-foreground">Cargando vista de cliente...</p>
        <p className="text-sm text-muted-foreground">Activando modo preview...</p>
      </div>
    </div>
  );
}

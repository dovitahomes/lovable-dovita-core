import { Navigate } from "react-router-dom";
import { useSessionReady } from "@/hooks/useSessionReady";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { status, refresh } = useSessionReady();

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-primary" />
        <p className="text-sm text-muted-foreground">Verificando sesión…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de sesión</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>No se pudo verificar la sesión</p>
            <Button onClick={refresh} variant="outline" size="sm">
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (status === 'no-session') {
    return <Navigate to="/auth/login" replace />;
  }

  // status === 'ready'
  return <>{children}</>;
};

export default ProtectedRoute;

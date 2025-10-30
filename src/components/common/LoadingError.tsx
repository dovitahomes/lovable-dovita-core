import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";

interface LoadingErrorProps {
  isLoading?: boolean;
  error?: any;
  isEmpty?: boolean;
  isForbidden?: boolean;
  emptyMessage?: string;
  forbiddenMessage?: string;
  onRetry?: () => void;
  onHelp?: () => void;
  children?: React.ReactNode;
}

export function LoadingError({
  isLoading = false,
  error = null,
  isEmpty = false,
  isForbidden = false,
  emptyMessage = "No hay datos disponibles",
  forbiddenMessage = "No tienes permisos para ver este módulo",
  onRetry,
  onHelp,
  children,
}: LoadingErrorProps) {
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // After 5s of loading, show different message
      const timer = setTimeout(() => {
        setLoadingTooLong(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTooLong(false);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          {loadingTooLong 
            ? "La carga está tomando más tiempo de lo esperado..." 
            : "Cargando datos…"}
        </p>
        {loadingTooLong && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (isForbidden) {
    return (
      <Alert variant="destructive" className="m-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acceso Restringido</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{forbiddenMessage}</span>
          {onHelp && (
            <Button
              onClick={onHelp}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Ver Ayuda
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    const isPermissionError = error?.message?.includes('permission') || 
                              error?.message?.includes('policy') ||
                              error?.code === 'PGRST301';
    
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{isPermissionError ? 'Sin Permisos' : 'Error'}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {isPermissionError 
              ? 'No tienes permisos para este módulo.' 
              : 'Hubo un problema al cargar la información'}
          </span>
          {onRetry && !isPermissionError && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Reintentar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}

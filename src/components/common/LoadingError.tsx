import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando…</p>
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
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Hubo un problema al cargar la información</span>
          {onRetry && (
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

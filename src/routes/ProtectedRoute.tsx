import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

type PermissionAction = 'view' | 'edit';

interface ProtectedRouteProps {
  children: ReactNode;
  moduleName?: string; // Opcional para rutas que solo requieren auth
  action?: PermissionAction;
  fallback?: ReactNode;
}

/**
 * Route guard que verifica autenticación y permisos de módulo.
 * Usa user_permissions para control de acceso + fallback admin via RPC.
 */
export function ProtectedRoute({ 
  children, 
  moduleName,
  action = 'view',
  fallback 
}: ProtectedRouteProps) {
  const { loading: authLoading, user } = useAuth();
  const { loading: permsLoading, has, isAdminFallback } = useModuleAccess();
  
  // Mostrar skeleton mientras verifica auth (no bloquear UI)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Mientras carga permisos, mostrar skeleton en lugar de bloquear
  if (permsLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Si no se especifica módulo, solo verificar autenticación
  if (!moduleName) {
    return <>{children}</>;
  }
  
  // Verificar permisos del módulo
  const hasPermission = has(moduleName, action) || isAdminFallback;
  
  console.log('[ProtectedRoute]', {
    moduleName,
    action,
    hasPermission,
    isAdminFallback
  });
  
  if (!hasPermission) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a este módulo ({moduleName}). Contacta al administrador si necesitas acceso.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
}

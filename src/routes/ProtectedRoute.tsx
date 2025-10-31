import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

interface ProtectedRouteProps {
  children: ReactNode;
  moduleName?: string;
  action?: PermissionAction;
  fallback?: ReactNode;
}

/**
 * Route guard that checks user authentication and module permissions
 * Uses user_permissions table to control access
 */
export function ProtectedRoute({ 
  children, 
  moduleName,
  action = 'view',
  fallback 
}: ProtectedRouteProps) {
  const { loading: authLoading, user } = useAuth();
  const { loading: permsLoading, canView, can } = useModuleAccess();
  
  // Show loading state while checking auth
  if (authLoading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // If no module specified, just check authentication
  if (!moduleName) {
    return <>{children}</>;
  }
  
  // Check module permission
  const hasPermission = action === 'view' 
    ? canView(moduleName)
    : can(moduleName, action);
  
  if (!hasPermission) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para acceder a este módulo. Contacta al administrador si necesitas acceso.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
}

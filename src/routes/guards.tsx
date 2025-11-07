import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Loader2 } from 'lucide-react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const { loading: permsLoading } = useModuleAccess();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // If permissions are still loading but user is authenticated, show content anyway
  // (permissions will load in background and update UI when ready)
  if (permsLoading) {
    console.info('[RequireAuth] Permissions loading, allowing access');
  }
  
  return <>{children}</>;
}

export function RequireModule({ 
  moduleName, 
  children 
}: { 
  moduleName: string; 
  children: ReactNode;
}) {
  const { loading: authLoading } = useAuth();
  const { loading: permsLoading, canView } = useModuleAccess();
  
  if (authLoading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check module permission
  if (!canView(moduleName)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/auth/AuthProvider';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id)
        .eq('role_name', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('[RequireAdmin] Error checking admin status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <ShieldX className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Acceso Denegado</AlertTitle>
          <AlertDescription className="mt-2">
            Solo administradores pueden acceder a esta sección.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return <>{children}</>;
}

import { ComponentType, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { shouldUseClientShell } from '@/lib/auth/role';

export function withClientGuard<P extends object>(Component: ComponentType<P>) {
  return function GuardedComponent(props: P) {
    const navigate = useNavigate();
    const { role, loading } = useUserRole();

    useEffect(() => {
      if (loading) return;

      if (!role) {
        navigate('/auth/login', { replace: true });
        return;
      }

      if (!shouldUseClientShell(role)) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }, [role, loading, navigate]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      );
    }

    if (!role || !shouldUseClientShell(role)) {
      return null;
    }

    return <Component {...props} />;
  };
}

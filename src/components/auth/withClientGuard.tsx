import { ComponentType, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionReady } from '@/hooks/useSessionReady';
import { shouldUseClientShell } from '@/lib/auth/role';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/hooks/useUserRole';

export function withClientGuard<P extends object>(Component: ComponentType<P>) {
  return function GuardedComponent(props: P) {
    const navigate = useNavigate();
    const { status, session } = useSessionReady();
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      // No esperar si aún cargando sesión
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        navigate('/auth/login', { replace: true });
        return;
      }

      // Fetch role en paralelo (non-blocking)
      if (session?.user && !role && !loading) {
        setLoading(true);
        
        const fetchRole = async () => {
          try {
            const { data, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('[withClientGuard] Error:', error);
            }
            
            const userRole = data?.role as UserRole || 'cliente';
            setRole(userRole);

            // Redirect si no es cliente
            if (!shouldUseClientShell(userRole)) {
              navigate('/', { replace: true });
            }
          } catch (error) {
            console.error('[withClientGuard] Exception:', error);
            setRole('cliente'); // Default a cliente en caso de error
          } finally {
            setLoading(false);
          }
        };
        
        fetchRole();
      }
    }, [status, session, role, loading, navigate]);

    // Spinner pequeño solo si verificando sesión
    if (status === 'loading') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando acceso…</p>
          </div>
        </div>
      );
    }

    if (status === 'unauthenticated') {
      return null;
    }

    // Render children inmediatamente con sesión (rol se carga en background)
    return <Component {...props} />;
  };
}

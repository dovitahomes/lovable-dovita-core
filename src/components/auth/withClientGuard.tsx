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
    const [checkingRole, setCheckingRole] = useState(false);

    useEffect(() => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        navigate('/auth/login', { replace: true });
        return;
      }

      // Fetch user role
      if (session?.user && !role && !checkingRole) {
        setCheckingRole(true);
        
        const fetchRole = async () => {
          try {
            const { data, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('[withClientGuard] Error fetching role:', error);
            }
            
            const userRole = data?.role as UserRole || 'user';
            setRole(userRole);

            // Check if user should use client shell
            if (!shouldUseClientShell(userRole)) {
              navigate('/', { replace: true });
            }
          } catch (error) {
            console.error('[withClientGuard] Exception fetching role:', error);
          } finally {
            setCheckingRole(false);
          }
        };
        
        fetchRole();
      }
    }, [status, session, role, checkingRole, navigate]);

    if (status === 'loading' || checkingRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando acceso...</p>
          </div>
        </div>
      );
    }

    if (status === 'unauthenticated' || !role || !shouldUseClientShell(role)) {
      return null;
    }

    return <Component {...props} />;
  };
}

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { getEffectiveClientMode } from '@/lib/auth/role';

export function useClientAccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, loading: roleLoading } = useUserRole();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (roleLoading) return;

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          navigate('/auth/login', { replace: true });
          return;
        }

        const isImpersonating = getEffectiveClientMode();
        const currentPath = location.pathname;
        const isClientRoute = currentPath.startsWith('/client');

        // Real client - force to client portal ALWAYS
        if (role === 'cliente') {
          if (!isClientRoute) {
            navigate('/client/home', { replace: true });
            return;
          }
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Admin/user impersonating as client
        if (isImpersonating && (role === 'admin' || role === 'user')) {
          if (!isClientRoute) {
            navigate('/client/home?viewAsClient=1', { replace: true });
            return;
          }
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Staff trying to access client routes without impersonation
        if (isClientRoute && !isImpersonating) {
          navigate('/', { replace: true });
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Check if user email matches any client with projects (fallback)
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, clients!inner(email)')
          .eq('clients.email', user.email)
          .limit(1);

        if (projectsError) throw projectsError;

        if (!projects || projects.length === 0) {
          if (isClientRoute) {
            navigate('/', { replace: true });
          }
          setHasAccess(false);
          setLoading(false);
          return;
        }

        setHasAccess(true);
        setLoading(false);
      } catch (err) {
        console.error('Error checking client access:', err);
        setError(err instanceof Error ? err : new Error('Error al verificar acceso'));
        setHasAccess(false);
        setLoading(false);
        
        // Redirect to home on error
        if (location.pathname.startsWith('/client')) {
          navigate('/', { replace: true });
        }
      }
    };

    checkAccess();
  }, [role, roleLoading, navigate, location.pathname]);

  return { hasAccess, loading, error };
}

export function useImpersonateMode() {
  const [isImpersonating, setIsImpersonating] = useState(() => {
    return getEffectiveClientMode();
  });

  useEffect(() => {
    setIsImpersonating(getEffectiveClientMode());
  }, []);

  const exitImpersonate = () => {
    localStorage.removeItem('dovita_view_as_client');
    window.location.href = '/';
  };

  return { isImpersonating, exitImpersonate };
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export function useClientAccess() {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (roleLoading) return;

      // Check for impersonate mode
      const urlParams = new URLSearchParams(window.location.search);
      const asClient = urlParams.get('asClient') === '1' || localStorage.getItem('asClient') === 'true';
      
      if (asClient && (role === 'admin' || role === 'user')) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // If already a client role, grant access
      if (role === 'cliente') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check if user is assigned to any project
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login', { replace: true });
        return;
      }

      // Check if user email matches any client with projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, clients!inner(email)')
        .eq('clients.email', user.email)
        .limit(1);

      if (error || !projects || projects.length === 0) {
        navigate('/auth/login', { replace: true });
        return;
      }

      setHasAccess(true);
      setLoading(false);
    };

    checkAccess();
  }, [role, roleLoading, navigate]);

  return { hasAccess, loading };
}

export function useImpersonateMode() {
  const [isImpersonating, setIsImpersonating] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('asClient') === '1' || localStorage.getItem('asClient') === 'true';
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('asClient') === '1') {
      localStorage.setItem('asClient', 'true');
      setIsImpersonating(true);
    }
  }, []);

  const exitImpersonate = () => {
    localStorage.removeItem('asClient');
    window.location.href = '/';
  };

  return { isImpersonating, exitImpersonate };
}

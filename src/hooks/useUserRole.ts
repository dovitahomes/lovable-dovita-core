import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDemoSession } from '@/auth/DemoGuard';
import { useSessionReady } from './useSessionReady';

export type UserRole = 'admin' | 'user' | 'colaborador' | 'cliente' | 'contador';

export function useUserRole() {
  const demoSession = useDemoSession();
  const { status, session } = useSessionReady();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If in demo mode, return demo role
    if (demoSession.isDemoMode) {
      setRole(demoSession.role);
      setLoading(false);
      return;
    }

    // Wait for session to be ready
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('[useUserRole] Error fetching role:', error);
        }

        setRole(data?.role as UserRole || 'user');
      } catch (error) {
        console.error('[useUserRole] Exception fetching role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [demoSession, status, session]);

  return { role, loading };
}
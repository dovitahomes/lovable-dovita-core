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
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[useUserRole] Timeout after 15s, defaulting to user role');
        setRole('user');
        setLoading(false);
      }
    }, 15000);

    // If in demo mode, return demo role
    if (demoSession.isDemoMode) {
      setRole(demoSession.role);
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    // Wait for session to be ready
    if (status === 'loading') {
      setLoading(true);
      return () => clearTimeout(timeout);
    }

    if (status === 'unauthenticated') {
      setRole(null);
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    const fetchRole = async () => {
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      try {
        console.info('[useUserRole] Fetching role for user:', session.user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('[useUserRole] Error fetching role:', error);
          setRole('user');
        } else {
          console.info('[useUserRole] Role fetched:', data?.role);
          setRole(data?.role as UserRole || 'user');
        }
      } catch (error) {
        console.error('[useUserRole] Exception fetching role:', error);
        setRole('user');
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchRole();

    return () => clearTimeout(timeout);
  }, [demoSession, status, session]);

  return { role, loading };
}
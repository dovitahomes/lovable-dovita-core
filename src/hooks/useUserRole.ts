import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDemoSession } from '@/auth/DemoGuard';
import { useSessionReady } from './useSessionReady';

export type UserRole = 'admin' | 'user' | 'colaborador' | 'cliente' | 'contador';

export function useUserRole() {
  const demoSession = useDemoSession();
  const { status, session } = useSessionReady();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false); // No bloqueante por defecto
  const [errorRole, setErrorRole] = useState(false);

  useEffect(() => {
    // Timeout de 15s NO bloqueante
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('[useUserRole] Timeout after 15s — returning empty');
        setRole(null);
        setErrorRole(true);
        setLoading(false);
      }
    }, 15000);

    // Demo mode
    if (demoSession.isDemoMode) {
      setRole(demoSession.role);
      setLoading(false);
      setErrorRole(false);
      clearTimeout(timeout);
      return;
    }

    // Si no hay sesión aún, no cargar
    if (status === 'loading') {
      return () => clearTimeout(timeout);
    }

    if (status === 'unauthenticated') {
      setRole(null);
      setLoading(false);
      setErrorRole(false);
      clearTimeout(timeout);
      return;
    }

    // Cargar rol en paralelo (no bloqueante)
    const fetchRole = async () => {
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      setLoading(true);
      try {
        console.info('[useUserRole] Fetching role...');
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('[useUserRole] Error:', error);
          setRole(null);
          setErrorRole(true);
        } else {
          console.info('[useUserRole] ✓ Loaded:', data?.role);
          setRole(data?.role as UserRole || null);
          setErrorRole(false);
        }
      } catch (error) {
        console.error('[useUserRole] Exception:', error);
        setRole(null);
        setErrorRole(true);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchRole();

    return () => clearTimeout(timeout);
  }, [demoSession, status, session]);

  return { role, loading, errorRole };
}
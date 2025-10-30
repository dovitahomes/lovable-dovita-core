import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Permission = {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

const LS_KEY = 'dovita:last_good_permissions';

export function useStablePermissions() {
  const [perms, setPerms] = useState<Permission[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Permission[]) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const fetching = useRef(false);

  // Helper: save last valid if there's at least one can_view
  const saveIfValid = (p: Permission[]) => {
    const valid = Array.isArray(p) && p.some((x) => x?.can_view);
    if (valid) {
      localStorage.setItem(LS_KEY, JSON.stringify(p));
      setPerms(p);
    } else {
      // NO overwrite with empty; keep last good
      console.warn('[perms] Empty or no can_view — keeping last valid');
    }
  };

  const fetchOnce = async () => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user?.id;
      if (!uid) throw new Error('NO_SESSION');

      const { data, error } = await supabase
        .from('user_module_permissions')
        .select('module_name, can_view, can_create, can_edit, can_delete')
        .eq('user_id', uid);

      if (error) throw error;
      saveIfValid(data || []);
    } catch (e: any) {
      console.error('[perms] Fetch error:', e?.message || e);
      setError(e?.message || 'PERMS_ERROR');
      // Don't clobber: keep last valid
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchOnce();
    
    // Timeout de 3s: si no cargó, mostrar mensaje "Sin permisos asignados"
    const timeout = setTimeout(() => {
      if (loading && perms.length === 0) {
        console.warn('[perms] Timeout de 3s alcanzado sin permisos');
        setLoading(false);
        setError('timeout');
      }
    }, 3000);
    
    // Re-fetch only on real auth events
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      console.log('[perms] Auth event:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        fetchOnce();
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LS_KEY);
        setPerms([]); // Only clear on explicit sign out
      }
    });
    
    return () => {
      clearTimeout(timeout);
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Quick memo for menu
  const viewable = useMemo(() => perms.filter((p) => p.can_view), [perms]);

  return { permissions: perms, viewable, loading, error, refetch: fetchOnce };
}

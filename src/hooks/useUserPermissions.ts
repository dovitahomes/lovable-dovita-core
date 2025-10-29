import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionReady } from './useSessionReady';

export type ModulePermission = {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export function useUserPermissions() {
  const { status, session } = useSessionReady();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Never leave in infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[permissions] Timeout after 15s');
        setIsLoading(false);
        setError('Timeout cargando permisos');
      }
    }, 15000);

    if (status === 'loading') {
      setIsLoading(true);
      return () => clearTimeout(timeout);
    }

    if (status === 'unauthenticated') {
      setPermissions([]);
      setIsLoading(false);
      setIsForbidden(false);
      clearTimeout(timeout);
      return;
    }

    const fetchPermissions = async () => {
      if (!session?.user) {
        setPermissions([]);
        setIsLoading(false);
        setIsForbidden(false);
        clearTimeout(timeout);
        return;
      }

      try {
        console.info('[permissions] Fetching for user:', session.user.id);
        const { data, error: fetchError } = await supabase
          .from('user_module_permissions')
          .select('module_name, can_view, can_create, can_edit, can_delete')
          .eq('user_id', session.user.id);

        if (fetchError) {
          // Check if it's a 403/RLS/401 error
          if (fetchError.code === 'PGRST301' || 
              fetchError.code === '401' || 
              fetchError.code === '403' ||
              fetchError.message?.includes('row-level security') || 
              fetchError.message?.includes('permission denied')) {
            console.error('[permissions] RLS/403/401 error:', fetchError);
            setIsForbidden(true);
            setError(null);
            setPermissions([]);
          } else {
            throw fetchError;
          }
        } else {
          // Detect empty results explicitly
          if (data && data.length === 0) {
            console.warn('[permissions] No permissions found, treating as empty (not blocking)');
            setPermissions([]);
            setIsForbidden(false);
            setError(null);
          } else {
            console.info('[permissions] ✓ Loaded:', data?.length || 0, 'permissions');
            setPermissions(data || []);
            setIsForbidden(false);
            setError(null);
          }
        }
      } catch (err) {
        console.error('[permissions] Error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Error cargando permisos';
        setError(errorMsg);
        setPermissions([]);
        setIsForbidden(false);
      } finally {
        setIsLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchPermissions();

    return () => clearTimeout(timeout);
  }, [status, session]);

  const hasModule = (moduleName: string) => {
    return permissions.some(p => p.module_name === moduleName && p.can_view);
  };

  const hasPermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view') => {
    const perm = permissions.find((p) => p.module_name === moduleName);
    if (!perm) return false;

    switch (action) {
      case 'view':
        return perm.can_view;
      case 'create':
        return perm.can_create;
      case 'edit':
        return perm.can_edit;
      case 'delete':
        return perm.can_delete;
      default:
        return false;
    }
  };

  return {
    permissions,
    isLoading,
    isForbidden,
    error,
    hasModule,
    hasPermission,
  };
}

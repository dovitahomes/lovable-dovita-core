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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      if (!session?.user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('user_module_permissions')
          .select('module_name, can_view, can_create, can_edit, can_delete')
          .eq('user_id', session.user.id);

        if (fetchError) throw fetchError;

        setPermissions(data || []);
        setError(null);
      } catch (err) {
        console.error('[useUserPermissions] Error:', err);
        setError(err instanceof Error ? err.message : 'Error cargando permisos');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [status, session]);

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
    loading,
    error,
    hasPermission,
  };
}

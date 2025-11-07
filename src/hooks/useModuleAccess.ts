import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/app/auth/AuthProvider';
import { MODULES } from '@/config/modules';

export type ModulePerm = {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export function useModuleAccess() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<ModulePerm[]>([]);

  useEffect(() => {
    let active = true;
    
    async function load() {
      if (!user) {
        console.log('[useModuleAccess] No user, clearing permissions');
        setPerms([]);
        setLoading(false);
        return;
      }
      
      console.log('[useModuleAccess] Loading permissions for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('user_permissions')
          .select('module_name, can_view, can_create, can_edit, can_delete')
          .eq('user_id', user.id);

        if (!active) return;
        
        if (error) {
          console.error('[useModuleAccess] Error loading permissions:', error.message);
          setPerms([]);
        } else if (!data || data.length === 0) {
          console.warn('[useModuleAccess] No permissions found for user', user.id);
          setPerms([]);
        } else {
          console.info(`[useModuleAccess] ✓ Loaded ${data.length} permissions`);
          setPerms(data.map((d: any) => ({
            module_name: d.module_name,
            can_view: !!d.can_view,
            can_create: !!d.can_create,
            can_edit: !!d.can_edit,
            can_delete: !!d.can_delete,
          })));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('[useModuleAccess] Exception loading permissions:', err);
        setPerms([]);
        setLoading(false);
      }
    }
    
    load();
    
    return () => { 
      active = false;
    };
  }, [user?.id])

  const has = (moduleName: string, action: 'view' | 'edit') => {
    const p = perms.find(p => p.module_name === moduleName);
    if (!p) return false;
    
    if (action === 'view') return p.can_view;
    if (action === 'edit') return p.can_edit;
    return false;
  };

  // Backward compatibility
  const canView = (moduleName: string) => has(moduleName, 'view');
  
  const can = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    const p = perms.find(p => p.module_name === moduleName);
    if (!p) return false;
    if (action === 'view') return p.can_view;
    if (action === 'create') return p.can_create;
    if (action === 'edit') return p.can_edit;
    if (action === 'delete') return p.can_delete;
    return false;
  };

  return { loading, perms, has, canView, can };
}

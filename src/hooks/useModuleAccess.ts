import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/app/auth/AuthProvider';

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
    let timeoutId: NodeJS.Timeout;
    
    async function load() {
      if (!user) {
        setPerms([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Safety timeout - if permissions don't load in 3s, use empty array
      timeoutId = setTimeout(() => {
        if (active) {
          console.warn('[useModuleAccess] Timeout loading permissions, using empty array');
          setPerms([]);
          setLoading(false);
        }
      }, 3000);
      
      try {
        const { data, error } = await (supabase as any)
          .from('user_permissions')
          .select('module_name, can_view, can_create, can_edit, can_delete')
          .eq('user_id', user.id);

        if (!active) return;
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.warn('[useModuleAccess] Error loading permissions:', error.message);
          setPerms([]);
        } else {
          console.info(`[useModuleAccess] ✓ Loaded ${data?.length || 0} permissions for user ${user.id}`);
          setPerms((data ?? []).map((d: any) => ({
            module_name: d.module_name,
            can_view: !!d.can_view,
            can_create: !!d.can_create,
            can_edit: !!d.can_edit,
            can_delete: !!d.can_delete,
          })));
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn('[useModuleAccess] Exception loading permissions:', err);
        setPerms([]);
      }
      
      setLoading(false);
    }
    
    load();
    
    return () => { 
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user?.id])

  const canView = (moduleName: string) => 
    perms.some(p => p.module_name === moduleName && p.can_view);
  
  const can = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    const p = perms.find(p => p.module_name === moduleName);
    if (!p) return false;
    if (action === 'view') return p.can_view;
    if (action === 'create') return p.can_create;
    if (action === 'edit') return p.can_edit;
    if (action === 'delete') return p.can_delete;
    return false;
  };

  return { loading, perms, canView, can };
}

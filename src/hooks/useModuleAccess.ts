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
      
      console.log('[useModuleAccess] 🔍 Loading permissions for user:', user.id);
      
      try {
        // PASO 1: Verificar y refrescar sesión si es necesario
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useModuleAccess] ❌ Session error:', sessionError.message);
        }
        
        if (!session) {
          console.warn('[useModuleAccess] ⚠️ No session, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.error('[useModuleAccess] ❌ Refresh failed, cannot load permissions');
            setPerms([]);
            setLoading(false);
            return;
          }
          
          session = refreshData.session;
          console.log('[useModuleAccess] ✓ Session refreshed successfully');
        }
        
        console.log('[useModuleAccess] ✓ Valid session found, user_id:', session.user.id);
        
        // PASO 2: Consultar permisos con sesión válida
        const { data, error } = await supabase
          .from('user_permissions')
          .select('module_name, can_view, can_create, can_edit, can_delete')
          .eq('user_id', user.id);

        if (!active) return;
        
        // PASO 3: Logging detallado del resultado
        console.log('[useModuleAccess] 📊 Query result:', {
          user_id: user.id,
          data_length: data?.length || 0,
          error_message: error?.message,
          error_code: error?.code,
          has_clientes: data?.some(p => p.module_name === 'clientes'),
          sample: data?.filter(p => p.module_name === 'clientes')
        });
        
        if (error) {
          console.error('[useModuleAccess] ❌ Error loading permissions:', error.message, 'Code:', error.code);
          setPerms([]);
        } else if (!data || data.length === 0) {
          console.warn('[useModuleAccess] ⚠️ No permissions found for user', user.id);
          setPerms([]);
        } else {
          console.info(`[useModuleAccess] ✓ Loaded ${data.length} permissions for user ${user.id}`);
          const mappedPerms = data.map((d: any) => ({
            module_name: d.module_name,
            can_view: !!d.can_view,
            can_create: !!d.can_create,
            can_edit: !!d.can_edit,
            can_delete: !!d.can_delete,
          }));
          console.log('[useModuleAccess] 📋 Permissions mapped successfully');
          setPerms(mappedPerms);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('[useModuleAccess] ❌ Exception loading permissions:', err);
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

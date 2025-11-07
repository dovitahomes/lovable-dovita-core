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
  const [isAdminFallback, setIsAdminFallback] = useState(false);

  useEffect(() => {
    let active = true;
    
    async function load() {
      if (!user) {
        console.log('[useModuleAccess] No user, clearing permissions');
        setPerms([]);
        setIsAdminFallback(false);
        setLoading(false);
        return;
      }
      
      console.log('[useModuleAccess] Loading permissions for user:', user.id);
      
      try {
        // Intentar cargar permisos de user_permissions
        console.log('[useModuleAccess] Querying user_permissions for user:', user.id);
        const { data, error } = await supabase
          .from('user_permissions')
          .select('module_name, can_view, can_create, can_edit, can_delete')
          .eq('user_id', user.id);

        if (!active) return;
        
        console.log('[useModuleAccess] Query result:', { 
          hasData: !!data, 
          count: data?.length || 0, 
          error: error?.message 
        });
        
        if (error) {
          console.warn('[useModuleAccess] Error loading permissions:', error.message);
          await checkAdminFallback();
        } else if (!data || data.length === 0) {
          console.warn('[useModuleAccess] No permissions found, checking admin fallback');
          await checkAdminFallback();
        } else {
          console.info(`[useModuleAccess] ✓ Loaded ${data.length} permissions for user ${user.id}`);
          setPerms(data.map((d: any) => ({
            module_name: d.module_name,
            can_view: !!d.can_view,
            can_create: !!d.can_create,
            can_edit: !!d.can_edit,
            can_delete: !!d.can_delete,
          })));
          setIsAdminFallback(false);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[useModuleAccess] Exception loading permissions:', err);
        await checkAdminFallback();
      }
    }
    
    async function checkAdminFallback() {
      if (!user || !active) return;
      
      try {
        console.log('[useModuleAccess] Checking admin fallback via RPC for user:', user.id);
        const { data: isAdmin, error } = await supabase.rpc('current_user_has_role', {
          p_role_name: 'admin'
        });
        
        if (!active) return;
        
        if (error) {
          console.warn('[useModuleAccess] Admin RPC check failed:', error.message);
          setPerms([]);
          setIsAdminFallback(false);
        } else if (isAdmin) {
          console.warn('[useModuleAccess] ⚠️ ADMIN FALLBACK ACTIVATED - granting full access to all modules');
          
          // Crear permisos completos para todos los módulos del sistema
          const allModules = MODULES
            .filter(m => m.group !== 'ClientOnly')
            .map(m => m.key);
          
          const virtualPerms: ModulePerm[] = allModules.map(moduleName => ({
            module_name: moduleName,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: true,
          }));
          
          console.log('[useModuleAccess] Admin fallback created', virtualPerms.length, 'virtual permissions');
          setPerms(virtualPerms);
          setIsAdminFallback(true);
        } else {
          console.warn('[useModuleAccess] User is not admin and has no permissions');
          setPerms([]);
          setIsAdminFallback(false);
        }
      } catch (err) {
        console.warn('[useModuleAccess] Admin fallback exception:', err);
        setPerms([]);
        setIsAdminFallback(false);
      }
      
      setLoading(false);
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

  return { loading, perms, has, canView, can, isAdminFallback };
}

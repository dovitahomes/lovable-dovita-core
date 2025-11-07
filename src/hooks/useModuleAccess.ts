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
    
    async function load() {
      if (!user) {
        console.log('[useModuleAccess] No user, clearing permissions');
        setPerms([]);
        setLoading(false);
        return;
      }
      
      console.log('[useModuleAccess] Loading permissions for user:', user.id);
      setLoading(true);
      
      try {
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
        console.log('[useModuleAccess] Checking admin fallback for user:', user.id);
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role_name')
          .eq('user_id', user.id)
          .eq('role_name', 'admin')
          .maybeSingle();
        
        if (!active) return;
        
        if (error) {
          console.warn('[useModuleAccess] Admin fallback check failed:', error.message);
          setPerms([]);
        } else if (roles) {
          console.warn('[useModuleAccess] ⚠️ User is admin but permissions failed to load. Using admin bypass - ALL modules accessible');
          // Create full permissions for all modules - admin bypass
          const allModules = [
            'dashboard', 'leads', 'clientes', 'tu', 'presupuestos', 'proveedores',
            'proyectos', 'construccion', 'finanzas', 'ordenes_compra', 'pagos',
            'lotes_pago', 'contabilidad', 'herramientas', 'usuarios', 'accesos',
            'alianzas', 'identidades', 'sucursales', 'reglas', 'contenido_corporativo'
          ];
          setPerms(allModules.map(module => ({
            module_name: module,
            can_view: true,
            can_create: true,
            can_edit: true,
            can_delete: true,
          })));
        } else {
          console.warn('[useModuleAccess] User is not admin and has no permissions');
          setPerms([]);
        }
      } catch (err) {
        console.warn('[useModuleAccess] Admin fallback exception:', err);
        setPerms([]);
      }
      
      setLoading(false);
    }
    
    load();
    
    return () => { 
      active = false;
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

import { supabase } from "@/integrations/supabase/client";

export type AdminUserListRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
};

/**
 * Lista todos los usuarios con sus roles (solo admin)
 */
export async function adminListUsers() {
  const { data, error } = await supabase.rpc('admin_list_users');
  
  if (error) {
    console.error('[adminListUsers] Error:', error);
    throw error;
  }
  
  return data as AdminUserListRow[];
}

/**
 * Asigna o quita un rol a un usuario (solo admin)
 */
export async function adminSetUserRole(
  userId: string,
  role: 'admin' | 'colaborador' | 'contador' | 'cliente',
  enabled: boolean
) {
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
    p_enabled: enabled,
  });
  
  if (error) {
    console.error('[adminSetUserRole] Error:', error);
    throw error;
  }
}

/**
 * Establece permisos de módulo para un usuario (solo admin)
 */
export async function adminSetModulePermission(
  userId: string,
  module: string,
  perms: {
    can_view?: boolean;
    can_create?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
  }
) {
  const { error } = await supabase.rpc('admin_set_module_permission', {
    p_user_id: userId,
    p_module: module,
    p_can_view: !!perms.can_view,
    p_can_create: !!perms.can_create,
    p_can_edit: !!perms.can_edit,
    p_can_delete: !!perms.can_delete,
  });
  
  if (error) {
    console.error('[adminSetModulePermission] Error:', error);
    throw error;
  }
}

import { supabase } from '@/integrations/supabase/client';

const BACKOFF_DELAYS = [250, 750, 1500]; // ms

/**
 * Ensures the current user has a profile and default role.
 * Called after successful authentication.
 * Retries up to 3 times with exponential backoff before failing.
 */
export async function bootstrapUser(): Promise<{
  success: boolean;
  roles?: any[];
  permissions?: any[];
  error?: string;
}> {
  const startTime = Date.now();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[bootstrapUser] Attempt ${attempt + 1}/3 - Starting profile setup`);
      
      // Paso 1: Asegurar perfil
      const profileStart = Date.now();
      await supabase.rpc('ensure_profile');
      console.log(`[bootstrapUser] ✓ Profile ensured (${Date.now() - profileStart}ms)`);
      
      // Paso 2: Asegurar rol por defecto
      const roleStart = Date.now();
      await supabase.rpc('ensure_default_role');
      console.log(`[bootstrapUser] ✓ Default role ensured (${Date.now() - roleStart}ms)`);
      
      // Paso 3: Cargar roles del usuario
      const rolesStart = Date.now();
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (rolesError) throw rolesError;
      console.log(`[bootstrapUser] ✓ Roles loaded (${Date.now() - rolesStart}ms):`, roles);
      
      // Paso 4: Cargar permisos de módulos
      const permsStart = Date.now();
      const { data: permissions, error: permsError } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (permsError) throw permsError;
      console.log(`[bootstrapUser] ✓ Permissions loaded (${Date.now() - permsStart}ms):`, permissions);
      
      const totalTime = Date.now() - startTime;
      console.log(`[bootstrapUser] ✅ Success in ${totalTime}ms (attempt ${attempt + 1})`);
      
      return {
        success: true,
        roles,
        permissions,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[bootstrapUser] ❌ Attempt ${attempt + 1}/3 failed:`, errorMsg);
      
      if (attempt < 2) {
        const delay = BACKOFF_DELAYS[attempt];
        console.log(`[bootstrapUser] ⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  const errorMsg = `No se pudieron cargar permisos después de 3 intentos (${totalTime}ms)`;
  console.error(`[bootstrapUser] ❌ ${errorMsg}`);
  
  return {
    success: false,
    error: errorMsg,
  };
}

import { supabase } from '@/integrations/supabase/client';
import { getUserIdOrNull } from '@/lib/authClient';

const BACKOFF_DELAYS = [250, 750, 1500]; // ms

export type BootstrapResult = {
  ok: boolean;
  roles: any[];
  permissions: any[];
  reason?: 'NO_SESSION' | 'BOOTSTRAP_FAILED';
};

/**
 * Ensures the current user has a profile, role, and permissions.
 * NEVER throws - always returns a result object.
 * Safe to call after login; won't block UI indefinitely.
 */
export async function bootstrapUser({ maxRetries = 3 } = {}): Promise<BootstrapResult> {
  const startTime = Date.now();

  // Step 0: Check session exists
  const userId = await getUserIdOrNull();
  if (!userId) {
    console.info('[bootstrap] No session - skipping bootstrap');
    return { ok: false, roles: [], permissions: [], reason: 'NO_SESSION' };
  }

  console.info('[bootstrap] Starting bootstrap for user:', userId);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.info(`[bootstrap] Attempt ${attempt + 1}/${maxRetries}`);
      
      // Step 1: Ensure profile
      const profileStart = Date.now();
      const { error: profileError } = await supabase.rpc('ensure_profile');
      if (profileError) {
        console.warn(`[bootstrap] Profile RPC warning:`, profileError);
      } else {
        console.info(`[bootstrap] ✓ Profile ensured (${Date.now() - profileStart}ms)`);
      }
      
      // Step 2: Ensure default role
      const roleStart = Date.now();
      const { error: roleError } = await supabase.rpc('ensure_default_role');
      if (roleError) {
        console.warn(`[bootstrap] Role RPC warning:`, roleError);
      } else {
        console.info(`[bootstrap] ✓ Default role ensured (${Date.now() - roleStart}ms)`);
      }
      
      // Step 3: Load user roles
      const rolesStart = Date.now();
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      console.info(`[bootstrap] ✓ Roles loaded (${Date.now() - rolesStart}ms):`, roles);
      
      // Step 4: Load module permissions
      const permsStart = Date.now();
      const { data: permissions, error: permsError } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);
      
      if (permsError) throw permsError;
      console.info(`[bootstrap] ✓ Permissions loaded (${Date.now() - permsStart}ms):`, permissions);
      
      const totalTime = Date.now() - startTime;
      console.info(`[bootstrap] ✅ Success in ${totalTime}ms (attempt ${attempt + 1})`);
      
      return {
        ok: true,
        roles: roles || [],
        permissions: permissions || [],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.code;
      console.error(`[bootstrap] ❌ Attempt ${attempt + 1}/${maxRetries} failed:`, {
        message: errorMsg,
        code: errorCode,
        error
      });
      
      if (attempt < maxRetries - 1) {
        const delay = BACKOFF_DELAYS[attempt];
        console.info(`[bootstrap] ⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.error(`[bootstrap] ❌ Failed after ${maxRetries} attempts (${totalTime}ms)`);
  
  return {
    ok: false,
    roles: [],
    permissions: [],
    reason: 'BOOTSTRAP_FAILED',
  };
}

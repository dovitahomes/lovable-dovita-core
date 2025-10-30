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
 * 
 * Uses the new bootstrap_user_access RPC which:
 * - Creates profile
 * - Assigns default role (colaborador) if no role exists
 * - Assigns cliente role if user email exists in clients table
 * - Seeds permissions for all user roles via trigger
 */
export async function bootstrapUser({ maxRetries = 3 } = {}): Promise<BootstrapResult> {
  const startTime = Date.now();

  // Step 0: Check session exists
  const userId = await getUserIdOrNull();
  if (!userId) {
    console.info('[bootstrap] No session - skipping bootstrap');
    return { ok: false, roles: [], permissions: [], reason: 'NO_SESSION' };
  }

  // Get user email for first admin bootstrap
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email || '';
  
  console.info('[bootstrap] Starting bootstrap for user:', userId, 'email:', userEmail);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.info(`[bootstrap] Attempt ${attempt + 1}/${maxRetries}`);
      
      // Step 1: Call unified bootstrap RPC (creates profile + roles + permissions)
      const bootstrapStart = Date.now();
      try {
        await supabase.rpc('bootstrap_user_access', {
          target_user_id: userId
        });
        console.info(`[bootstrap] ✓ bootstrap_user_access completed (${Date.now() - bootstrapStart}ms)`);
      } catch (err) {
        console.warn('[bootstrap] bootstrap_user_access failed (non-blocking):', err);
      }

      // Step 2: Grant admin if whitelisted
      try {
        await supabase.rpc('grant_admin_if_whitelisted');
        console.info('[bootstrap] ✓ grant_admin_if_whitelisted completed');
      } catch (err) {
        console.warn('[bootstrap] grant_admin_if_whitelisted failed (non-blocking):', err);
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
      const rolesArray = (roles || []).map(r => r.role);
      console.info(`[bootstrap] ✅ Success in ${totalTime}ms (attempt ${attempt + 1})`);
      console.info(`[login] roles=${JSON.stringify(rolesArray)}`);
      console.info(`[login] modules=${(permissions || []).length}`);
      
      // Persist to localStorage for quick access
      try {
        localStorage.setItem('dv_roles_v1', JSON.stringify((roles || []).map(r => r.role)));
        localStorage.setItem('dv_permissions_v1', JSON.stringify(permissions || []));
      } catch (err) {
        console.warn('[bootstrap] Could not persist to localStorage:', err);
      }
      
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

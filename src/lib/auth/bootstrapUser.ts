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
      
      // Step 1: Try to bootstrap first admin (before other bootstraps)
      try {
        console.info('[bootstrap] Attempting first admin bootstrap...');
        const { data: firstAdminResult } = await supabase.rpc('bootstrap_first_admin', {
          p_email: userEmail
        });
        console.info('[bootstrap] First admin bootstrap result:', firstAdminResult);
      } catch (err) {
        // Silently ignore - either admin already exists or other non-critical error
        console.info('[bootstrap] First admin bootstrap skipped:', err);
      }
      
      // Step 2: Call unified bootstrap RPC (creates profile + roles + permissions)
      const bootstrapStart = Date.now();
      const { error: bootstrapError } = await supabase.rpc('bootstrap_user_access', {
        target_user_id: userId
      });
      
      if (bootstrapError) {
        console.warn(`[bootstrap] Bootstrap RPC failed, continuing anyway:`, bootstrapError);
        // No bloquear navegación - continuar con refetch
      } else {
        console.info(`[bootstrap] ✓ Bootstrap RPC completed (${Date.now() - bootstrapStart}ms)`);
      }
      
      // Step 2: Load user roles
      const rolesStart = Date.now();
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      console.info(`[bootstrap] ✓ Roles loaded (${Date.now() - rolesStart}ms):`, roles);
      
      // Step 3: Load module permissions
      const permsStart = Date.now();
      const { data: permissions, error: permsError } = await supabase
        .from('user_module_permissions')
        .select('*')
        .eq('user_id', userId);
      
      if (permsError) throw permsError;
      console.info(`[bootstrap] ✓ Permissions loaded (${Date.now() - permsStart}ms):`, permissions);
      
      const totalTime = Date.now() - startTime;
      console.info(`[bootstrap] ✅ Success in ${totalTime}ms (attempt ${attempt + 1})`);
      console.info(`[login] email=${userEmail}, bootstrapAccess=ok, roles=[${(roles || []).map(r => r.role).join(', ')}], perms=${(permissions || []).length}`);
      
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

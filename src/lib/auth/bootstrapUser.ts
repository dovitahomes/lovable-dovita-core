import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the current user has a profile and default role.
 * Called after successful authentication.
 */
export async function bootstrapUser(): Promise<void> {
  try {
    // Ensure profile exists
    await supabase.rpc('ensure_profile');
  } catch (error) {
    console.warn('[bootstrapUser] Profile setup failed:', error);
  }

  try {
    // Ensure default role exists
    await supabase.rpc('ensure_default_role');
  } catch (error) {
    console.warn('[bootstrapUser] Role setup failed:', error);
  }
}

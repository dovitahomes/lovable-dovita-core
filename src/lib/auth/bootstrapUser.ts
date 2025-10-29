import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the current user has a profile and default role.
 * Called after successful authentication.
 * Retries up to 3 times before failing.
 */
export async function bootstrapUser(): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await supabase.rpc('ensure_profile');
      await supabase.rpc('ensure_default_role');
      console.info('[bootstrapUser] Profile and role ensured successfully');
      return;
    } catch (error) {
      console.error(`[bootstrapUser] Attempt ${attempt + 1}/3 failed:`, error);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  throw new Error('No se pudo inicializar el perfil/rol del usuario después de 3 intentos.');
}

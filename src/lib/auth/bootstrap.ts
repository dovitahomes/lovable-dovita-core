import { supabase } from '@/integrations/supabase/client';

export async function bootstrapUserAfterLogin(): Promise<boolean> {
  try {
    console.info('[bootstrap] Iniciando bootstrap...');
    
    const { error } = await supabase.rpc('bootstrap_user_on_login');
    
    if (error) {
      console.error('[bootstrap] Error:', error);
      return false;
    }
    
    console.info('[bootstrap] ✅ Bootstrap completado');
    return true;
  } catch (err) {
    console.error('[bootstrap] Excepción:', err);
    return false;
  }
}

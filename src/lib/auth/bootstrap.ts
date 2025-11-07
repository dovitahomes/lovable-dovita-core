import { supabase } from '@/integrations/supabase/client';

export async function bootstrapUserAfterLogin(): Promise<boolean> {
  try {
    console.info('[bootstrap] Iniciando bootstrap...');
    
    const { error } = await supabase.rpc('bootstrap_user_on_login');
    
    if (error) {
      console.error('[bootstrap] Error:', error);
      return false;
    }
    
    // Marcar bootstrap como completado
    sessionStorage.setItem('bootstrap_completed', 'true');
    console.info('[bootstrap] ✅ Bootstrap completado y marcado');
    return true;
  } catch (err) {
    console.error('[bootstrap] Excepción:', err);
    return false;
  }
}

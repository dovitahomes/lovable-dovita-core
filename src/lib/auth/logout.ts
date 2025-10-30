import { supabase } from '@/integrations/supabase/client';

export async function appSignOut() {
  try {
    console.info('[logout] Starting signOut...');
    
    // Cierra sesión
    await supabase.auth.signOut();
    
    // Limpia todo el almacenamiento local
    localStorage.clear();
    sessionStorage.clear();
    
    console.info('[logout] signOut OK → redirecting to /auth/login');
  } catch (e) {
    console.error('[logout] error', e);
  } finally {
    // Redirección dura para garantizar estado limpio
    window.location.assign('/auth/login');
  }
}

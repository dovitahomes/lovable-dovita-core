import { supabase } from '@/integrations/supabase/client';

export async function appSignOut() {
  try {
    console.info('[logout] Cierre de sesión iniciado...');
    await supabase.auth.signOut();
  } catch (e) {
    console.error('[logout] error', e);
  } finally {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    window.location.assign('/auth/login');
  }
}

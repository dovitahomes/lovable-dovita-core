import { supabase } from '@/integrations/supabase/client';

export async function appSignOut() {
  try {
    console.info('[logout] Starting signOut...');
    
    // Limpia caches locales
    localStorage.removeItem('dvta.selectedProjectId');
    localStorage.removeItem('dvta.clientProjectId');
    localStorage.removeItem('dvta.permissionsCache');
    localStorage.removeItem('dv_roles_v1');
    localStorage.removeItem('dv_permissions_v1');
    localStorage.removeItem('dv_corporate_v1');
    
    // Cierra sesión local y remota
    await supabase.auth.signOut({ scope: 'local' });
    
    console.info('[logout] signOut OK → redirecting to /auth/login');
  } catch (e) {
    console.error('[logout] error', e);
  } finally {
    // Redirección dura para garantizar estado limpio
    window.location.href = '/auth/login';
  }
}

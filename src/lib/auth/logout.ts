import { supabase } from '@/integrations/supabase/client';

export async function appSignOut() {
  console.info('[logout] Starting signOut...');
  
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[logout] signOut error (non-blocking):', e);
  }
  
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.warn('[logout] storage clear error (non-blocking):', e);
  }
  
  console.info('[logout] signOut OK → redirecting to /auth/login');
  
  // Force redirect after 100ms to ensure cleanup completes
  setTimeout(() => {
    window.location.assign('/auth/login');
  }, 100);
  
  // Fallback safety timeout (2s)
  setTimeout(() => {
    console.warn('[logout] Forcing redirect after timeout');
    window.location.assign('/auth/login');
  }, 2000);
}

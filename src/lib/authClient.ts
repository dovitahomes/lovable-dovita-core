import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

/**
 * Waits for a valid session with retry logic.
 * Does NOT throw errors - returns null on timeout.
 */
export async function waitForSession({ timeoutMs = 20000 } = {}): Promise<Session | null> {
  const startTime = Date.now();
  const retryInterval = 300; // ms

  while (Date.now() - startTime < timeoutMs) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('[authClient] Session check error:', error);
      }
      
      if (session) {
        console.info('[authClient] ✓ Session acquired');
        return session;
      }
    } catch (err) {
      console.warn('[authClient] Exception while getting session:', err);
    }

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryInterval));
  }

  console.warn(`[authClient] Session timeout after ${timeoutMs}ms`);
  return null;
}

/**
 * Gets the current user ID or null if not authenticated.
 * Non-blocking, does not throw.
 */
export async function getUserIdOrNull(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch (err) {
    console.warn('[authClient] Error getting user ID:', err);
    return null;
  }
}

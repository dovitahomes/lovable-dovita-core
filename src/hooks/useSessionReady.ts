import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSessionReady() {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data?.session) {
          console.log('[useSessionReady] ✅ Session found, authenticating immediately');
          setSession(data.session);
          setStatus('authenticated');
        } else {
          console.warn('[useSessionReady] ⚠️ No session found');
          setStatus('unauthenticated');
        }
      } catch (err) {
        console.error('[useSessionReady] ❌ Error checking session', err);
        setStatus('unauthenticated');
      }
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      if (newSession) {
        console.log('[useSessionReady] 🔁 Session refreshed');
        setSession(newSession);
        setStatus('authenticated');
      } else {
        console.log('[useSessionReady] 🔒 Session cleared');
        setSession(null);
        setStatus('unauthenticated');
      }
    });

    timeoutId = setTimeout(() => {
      if (mounted && status === 'loading') {
        console.warn('[useSessionReady] ⏰ Timeout reached (10s) — assuming unauthenticated');
        setStatus('unauthenticated');
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      listener?.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    status,
    isReady: status !== 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

type SessionStatus = 'ready' | 'signed_out' | 'error';

export function useSessionReady() {
  const [status, setStatus] = useState<SessionStatus>('signed_out');
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('[session] error', error);
          setStatus('error');
          setAuthError(error.message);
          return;
        }

        if (data?.session) {
          console.log('[session] status=ready');
          setSession(data.session);
          setStatus('ready');
          setAuthError(null);
        } else {
          console.log('[session] status=signed_out');
          setSession(null);
          setStatus('signed_out');
        }
      } catch (err) {
        console.error('[session] unexpected error', err);
        setStatus('error');
        setAuthError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      console.log('[session] auth event:', event);
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setStatus('signed_out');
        setAuthError(null);
      } else if (newSession && ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        setSession(newSession);
        setStatus('ready');
        setAuthError(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    status,
    authError,
    isReady: status === 'ready',
    isSignedOut: status === 'signed_out',
  };
}

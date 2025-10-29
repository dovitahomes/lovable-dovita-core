import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSessionReady() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading (increased to 20s)
    timeoutId = setTimeout(() => {
      if (status === 'loading') {
        console.error('[useSessionReady] Session check timeout after 20s');
        setStatus('unauthenticated');
      }
    }, 20000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[useSessionReady] Error getting session:', error);
        setStatus('unauthenticated');
      } else {
        setSession(session);
        setStatus(session ? 'authenticated' : 'unauthenticated');
      }
      clearTimeout(timeoutId);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    status,
    isReady: status !== 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

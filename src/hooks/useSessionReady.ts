import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useSessionReady() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    // Timeout duro de 5s: si no hay sesión, marcar unauthenticated
    timeoutId = setTimeout(() => {
      if (mounted && status === 'loading') {
        console.warn('[useSessionReady] Timeout after 5s — marking unauthenticated');
        setStatus('unauthenticated');
        setSession(null);
      }
    }, 5000);

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      console.info('[useSessionReady] Auth state changed:', _event, !!session);
      setSession(session);
      setStatus(session ? 'authenticated' : 'unauthenticated');
      clearTimeout(timeoutId);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('[useSessionReady] Error getting session:', error);
        setStatus('unauthenticated');
        setSession(null);
      } else {
        console.info('[useSessionReady] Initial session:', !!session);
        setSession(session);
        setStatus(session ? 'authenticated' : 'unauthenticated');
      }
      clearTimeout(timeoutId);
    });

    return () => {
      mounted = false;
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

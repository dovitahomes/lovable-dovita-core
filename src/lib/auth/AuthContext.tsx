import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
};

const AuthContext = createContext<AuthState>({ 
  session: null, 
  status: 'loading' 
});

export const useAuthState = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ 
    session: null, 
    status: 'loading' 
  });

  useEffect(() => {
    let mounted = true;

    // Initial session check
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('[Auth] getSession error:', error);
        setState({ session: null, status: 'unauthenticated' });
      } else if (data?.session) {
        console.log('[Auth] ✅ Session found');
        setState({ session: data.session, status: 'authenticated' });
      } else {
        console.log('[Auth] No session');
        setState({ session: null, status: 'unauthenticated' });
      }
    })();

    // Listen to auth changes - ONLY respond to real Supabase events
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('[Auth] event:', event);
      
      // Only degrade to unauthenticated on explicit sign out
      if (event === 'SIGNED_OUT') {
        setState({ session: null, status: 'unauthenticated' });
      } else if (session) {
        // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED => authenticated
        setState({ session, status: 'authenticated' });
      } else {
        setState({ session: null, status: 'unauthenticated' });
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

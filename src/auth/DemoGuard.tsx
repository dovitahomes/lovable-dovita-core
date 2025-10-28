import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DemoSession {
  user: User | null;
  session: Session | null;
  isDemoMode: boolean;
  role: 'admin' | 'user' | 'colaborador' | 'cliente' | 'contador';
}

const DemoContext = createContext<DemoSession | undefined>(undefined);

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export function useDemoSession() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemoSession must be used within DemoGuard');
  }
  return context;
}

export function DemoGuard({ children }: { children: ReactNode }) {
  const [demoSession, setDemoSession] = useState<DemoSession>({
    user: null,
    session: null,
    isDemoMode: false,
    role: 'admin'
  });

  useEffect(() => {
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

    const checkSession = async () => {
      // First, check for a real session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Real session exists, use it
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setDemoSession({
          user: session.user,
          session: session,
          isDemoMode: false,
          role: roleData?.role || 'user'
        });
      } else if (isDemoMode) {
        // No real session, but demo mode is enabled
        const fakeDemoUser: User = {
          id: DEMO_USER_ID,
          email: 'demo@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        setDemoSession({
          user: fakeDemoUser,
          session: null,
          isDemoMode: true,
          role: 'admin'
        });
      }
    };

    checkSession();

    // Listen for auth changes (real sessions only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setDemoSession({
          user: session.user,
          session: session,
          isDemoMode: false,
          role: roleData?.role || 'user'
        });
      } else if (isDemoMode) {
        // Maintain demo session if no real session
        const fakeDemoUser: User = {
          id: DEMO_USER_ID,
          email: 'demo@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        setDemoSession({
          user: fakeDemoUser,
          session: null,
          isDemoMode: true,
          role: 'admin'
        });
      } else {
        setDemoSession({
          user: null,
          session: null,
          isDemoMode: false,
          role: 'user'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <DemoContext.Provider value={demoSession}>
      {demoSession.isDemoMode && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <strong>Demo Mode (dev only).</strong> RLS and real data may not reflect correctly. Database queries may fail.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </DemoContext.Provider>
  );
}

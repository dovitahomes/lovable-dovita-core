import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDemoSession } from '@/auth/DemoGuard';

export type UserRole = 'admin' | 'user' | 'colaborador' | 'cliente' | 'contador';

export function useUserRole() {
  const demoSession = useDemoSession();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If in demo mode, return demo role
    if (demoSession.isDemoMode) {
      setRole(demoSession.role);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setRole(data?.role as UserRole || 'user');
      setLoading(false);
    };

    fetchRole();
  }, [demoSession]);

  return { role, loading };
}
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserDetail {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  fecha_nacimiento: string | null;
  avatar_url: string | null;
  rfc: string | null;
  imss_number: string | null;
  fecha_ingreso: string | null;
  emergency_contact: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  roles: string[];
  sucursal_id: string | null;
  sucursal_nombre: string | null;
}

export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('vw_users_extended')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as UserDetail;
    },
    enabled: !!userId,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

export function useClientAppointments(projectId: string | null) {
  return useQuery({
    queryKey: ['client-appointments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_appointments')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

export function useClientProjectSummary(projectId: string | null) {
  return useQuery({
    queryKey: ['client-project-summary', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('v_client_project_summary')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}

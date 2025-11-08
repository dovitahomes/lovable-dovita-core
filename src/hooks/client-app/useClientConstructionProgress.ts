import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

export function useClientConstructionProgress(projectId: string | null) {
  return useQuery({
    queryKey: ['client-construction-progress', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_construction_progress')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}

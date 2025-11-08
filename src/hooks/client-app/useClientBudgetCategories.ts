import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

export function useClientBudgetCategories(projectId: string | null) {
  return useQuery({
    queryKey: ['client-budget-categories', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_budget_categories')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}

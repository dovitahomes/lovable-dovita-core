import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

interface FinancialData {
  project_id: string;
  client_id: string;
  client_name: string;
  total_deposits: number;
  total_expenses: number;
  balance: number;
  mayor_id: string | null;
  mayor_code: string | null;
  mayor_name: string | null;
  mayor_expense: number;
}

export function useClientFinancialSummary(projectId: string | null) {
  return useQuery({
    queryKey: ['client-financial-summary', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('vw_client_financial_summary')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data as FinancialData[];
    },
    enabled: !!projectId,
    staleTime: CACHE_CONFIG.active.staleTime,
    gcTime: CACHE_CONFIG.active.gcTime,
  });
}

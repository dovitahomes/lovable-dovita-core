import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface BudgetConsumption {
  project_id: string;
  budget_id: string;
  subpartida_id: string;
  qty_planned: number;
  qty_solicitada: number;
  qty_ordenada: number;
  qty_recibida: number;
  pct_consumida: number;
}

export function useBudgetConsumption(budgetId?: string) {
  return useQuery({
    queryKey: ["budget_consumption", budgetId],
    queryFn: async () => {
      if (!budgetId) return [];

      const { data, error } = await supabase
        .from("v_budget_consumption")
        .select("*")
        .eq("budget_id", budgetId);

      if (error) throw error;
      return (data || []) as BudgetConsumption[];
    },
    enabled: !!budgetId,
    ...CACHE_CONFIG.active,
  });
}

export function useSubpartidaConsumption(budgetId?: string, subpartidaId?: string) {
  return useQuery({
    queryKey: ["subpartida_consumption", budgetId, subpartidaId],
    queryFn: async () => {
      if (!budgetId || !subpartidaId) return null;

      const { data, error } = await supabase
        .from("v_budget_consumption")
        .select("*")
        .eq("budget_id", budgetId)
        .eq("subpartida_id", subpartidaId)
        .single();

      if (error) throw error;
      return data as BudgetConsumption;
    },
    enabled: !!budgetId && !!subpartidaId,
    ...CACHE_CONFIG.active,
  });
}

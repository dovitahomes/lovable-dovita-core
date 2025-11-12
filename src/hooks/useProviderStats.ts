import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

interface ProviderStats {
  total: number;
  active: number;
  withTerms: number;
  usedInBudgets: number;
}

export function useProviderStats() {
  return useQuery({
    queryKey: ["provider-stats"],
    queryFn: async (): Promise<ProviderStats> => {
      // Get all providers
      const { data: providers, error: providersError } = await supabase
        .from("providers")
        .select("id, activo, terms_json");

      if (providersError) throw providersError;

      const total = providers?.length || 0;
      const active = providers?.filter((p) => p.activo).length || 0;
      const withTerms = providers?.filter((p) => p.terms_json !== null).length || 0;

      // Get distinct providers used in budget_items
      const { data: budgetItems, error: budgetItemsError } = await supabase
        .from("budget_items")
        .select("provider_id")
        .not("provider_id", "is", null);

      if (budgetItemsError) throw budgetItemsError;

      // Count unique provider IDs
      const uniqueProviderIds = new Set(
        budgetItems?.map((item) => item.provider_id).filter(Boolean)
      );
      const usedInBudgets = uniqueProviderIds.size;

      return {
        total,
        active,
        withTerms,
        usedInBudgets,
      };
    },
    ...CACHE_CONFIG.catalogs, // 60s staleTime para catálogos
  });
}

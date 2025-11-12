import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface ProviderStatDetail {
  count: number;
  providerIds: string[];
}

export interface ProviderStats {
  total: ProviderStatDetail;
  active: ProviderStatDetail;
  withTerms: ProviderStatDetail;
  usedInBudgets: ProviderStatDetail;
}

/**
 * Helper function to validate if a provider has actual terms defined
 * Returns true only if at least ONE of the terms fields has real content
 */
function hasTerms(termsJson: any): boolean {
  if (!termsJson || typeof termsJson !== 'object') return false;
  
  return !!(
    (termsJson.tiempo_entrega && termsJson.tiempo_entrega.trim()) ||
    (termsJson.forma_pago && termsJson.forma_pago.trim()) ||
    (termsJson.condiciones && termsJson.condiciones.trim())
  );
}

export function useProviderStats() {
  return useQuery({
    queryKey: ["provider-stats"],
    queryFn: async (): Promise<ProviderStats> => {
      console.log("📊 [STATS] Calculating provider stats...");
      
      // Get all providers with necessary fields
      const { data: providers, error: providersError } = await supabase
        .from("providers")
        .select("id, code_short, activo, terms_json");

      if (providersError) throw providersError;

      const allProviders = providers || [];
      console.log("📊 [STATS] Loaded providers:", allProviders.length);

      // Calculate each stat with provider IDs
      const totalProviders = allProviders;
      const activeProviders = allProviders.filter((p) => p.activo);
      const withTermsProviders = allProviders.filter((p) => hasTerms(p.terms_json));
      
      console.log("📊 [STATS] Active:", activeProviders.length);
      console.log("📊 [STATS] With terms:", withTermsProviders.length, withTermsProviders.map(p => p.code_short));

      // Get providers used in budget_items (using proveedor_alias field)
      const { data: budgetItems, error: budgetItemsError } = await supabase
        .from("budget_items")
        .select("proveedor_alias")
        .not("proveedor_alias", "is", null);

      if (budgetItemsError) throw budgetItemsError;

      // Map proveedor_alias (code_short) to provider IDs
      const usedAliases = new Set(
        budgetItems?.map((item) => item.proveedor_alias).filter(Boolean) || []
      );

      const usedInBudgetsProviders = allProviders.filter((p) =>
        usedAliases.has(p.code_short)
      );
      
      console.log("📊 [STATS] Used in budgets:", usedInBudgetsProviders.length, usedInBudgetsProviders.map(p => p.code_short));
      console.log("✅ [STATS] Stats calculated successfully");

      return {
        total: {
          count: totalProviders.length,
          providerIds: totalProviders.map((p) => p.id),
        },
        active: {
          count: activeProviders.length,
          providerIds: activeProviders.map((p) => p.id),
        },
        withTerms: {
          count: withTermsProviders.length,
          providerIds: withTermsProviders.map((p) => p.id),
        },
        usedInBudgets: {
          count: usedInBudgetsProviders.length,
          providerIds: usedInBudgetsProviders.map((p) => p.id),
        },
      };
    },
    ...CACHE_CONFIG.catalogs, // 60s staleTime para catálogos
  });
}

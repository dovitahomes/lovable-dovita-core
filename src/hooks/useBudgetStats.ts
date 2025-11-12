import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface BudgetStatDetail {
  count: number;
  budgetIds: string[];
}

export interface BudgetStats {
  total: BudgetStatDetail;
  published: BudgetStatDetail;
  draft: BudgetStatDetail;
  totalValue: number; // Valor total en pipeline (suma de presupuestos publicados)
}

export function useBudgetStats() {
  return useQuery({
    queryKey: ["budget-stats"],
    queryFn: async (): Promise<BudgetStats> => {
      console.log("📊 [BUDGET-STATS] Calculating budget stats...");
      
      // Get all budgets with necessary fields from v_budget_history
      const { data: budgets, error: budgetsError } = await (supabase
        .from("v_budget_history" as any)
        .select("budget_id, status, budget_total") as any);

      if (budgetsError) throw budgetsError;

      const allBudgets = budgets || [];
      console.log("📊 [BUDGET-STATS] Loaded budgets:", allBudgets.length);

      // Calculate each stat with budget IDs
      const totalBudgets = allBudgets;
      const publishedBudgets = allBudgets.filter((b) => b.status === "publicado");
      const draftBudgets = allBudgets.filter((b) => b.status === "borrador");
      
      // Calculate total value of published budgets (pipeline value)
      const totalValue = publishedBudgets.reduce(
        (sum, budget) => sum + (Number(budget.budget_total) || 0),
        0
      );
      
      console.log("📊 [BUDGET-STATS] Total:", totalBudgets.length);
      console.log("📊 [BUDGET-STATS] Published:", publishedBudgets.length);
      console.log("📊 [BUDGET-STATS] Draft:", draftBudgets.length);
      console.log("📊 [BUDGET-STATS] Total Value:", totalValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
      console.log("✅ [BUDGET-STATS] Stats calculated successfully");

      return {
        total: {
          count: totalBudgets.length,
          budgetIds: totalBudgets.map((b) => b.budget_id),
        },
        published: {
          count: publishedBudgets.length,
          budgetIds: publishedBudgets.map((b) => b.budget_id),
        },
        draft: {
          count: draftBudgets.length,
          budgetIds: draftBudgets.map((b) => b.budget_id),
        },
        totalValue,
      };
    },
    ...CACHE_CONFIG.catalogs, // 60s staleTime para catálogos
  });
}

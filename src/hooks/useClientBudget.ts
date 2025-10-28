import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientBudget(projectId: string | null) {
  return useQuery({
    queryKey: ["client-budget", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get client-visible budget
      const { data: budget } = await supabase
        .from("budgets")
        .select("id, version")
        .eq("project_id", projectId)
        .eq("type", "ejecutivo")
        .eq("cliente_view_enabled", true)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (!budget) return null;

      // Get subtotals by mayor using the function
      const { data: subtotals, error } = await supabase.rpc(
        "get_budget_subtotals",
        { budget_id_param: budget.id }
      );

      if (error) throw error;

      const total = subtotals?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0;

      return {
        budgetId: budget.id,
        version: budget.version,
        subtotals: subtotals || [],
        total,
      };
    },
    enabled: !!projectId,
  });
}

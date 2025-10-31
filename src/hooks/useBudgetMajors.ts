import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BudgetMajor = {
  project_id: string;
  budget_id: string;
  mayor_id: string;
  mayor_name: string;
  importe: number;
  total_budget: number;
  pct_of_total: number;
};

export function useBudgetMajors(projectId: string | null) {
  return useQuery({
    queryKey: ["budget-majors", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("v_project_exec_budget_mayor_totals")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return (data || []) as BudgetMajor[];
    },
    enabled: !!projectId,
  });
}

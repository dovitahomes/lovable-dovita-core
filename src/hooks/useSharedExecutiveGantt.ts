import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GanttPlan, GanttItem, GanttMinistration } from "./useGanttPlan";

export function useSharedExecutiveGantt(projectId: string | null) {
  return useQuery({
    queryKey: ["shared-executive-gantt", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get the shared executive plan
      const { data: plan, error: planError } = await supabase
        .from("gantt_plans")
        .select("*")
        .eq("project_id", projectId)
        .eq("type", "ejecutivo")
        .eq("shared_with_construction", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;
      if (!plan) return null;

      // Get items and ministrations
      const [itemsRes, ministrationsRes] = await Promise.all([
        supabase
          .from("gantt_items")
          .select("*, tu_nodes(name, code)")
          .eq("gantt_id", plan.id)
          .order("order_index"),
        supabase
          .from("gantt_ministrations")
          .select("*")
          .eq("gantt_id", plan.id)
          .order("order_index"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (ministrationsRes.error) throw ministrationsRes.error;

      return {
        plan: plan as GanttPlan,
        items: (itemsRes.data || []) as GanttItem[],
        ministrations: (ministrationsRes.data || []) as GanttMinistration[],
      };
    },
    enabled: !!projectId,
  });
}

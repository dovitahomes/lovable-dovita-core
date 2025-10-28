import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientGanttProgress(projectId: string | null) {
  return useQuery({
    queryKey: ["client-gantt-progress", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get gantt plan shared with client
      const { data: ganttPlan } = await supabase
        .from("gantt_plans")
        .select("id, type, updated_at")
        .eq("project_id", projectId)
        .eq("shared_with_construction", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (!ganttPlan) return null;

      // Get gantt items to calculate progress
      const { data: items } = await supabase
        .from("gantt_items")
        .select("end_date")
        .eq("gantt_id", ganttPlan.id);

      const now = new Date();
      const completed = items?.filter(item => new Date(item.end_date) < now).length || 0;
      const total = items?.length || 0;
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get next ministration
      const { data: nextMinistration } = await supabase
        .from("gantt_ministrations")
        .select("date, label")
        .eq("gantt_id", ganttPlan.id)
        .gte("date", now.toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(1)
        .single();

      return {
        progressPct,
        completed,
        total,
        nextMinistration,
      };
    },
    enabled: !!projectId,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientUpcomingEvents(projectId: string | null) {
  return useQuery({
    queryKey: ["client-upcoming-events", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("v_client_events")
        .select("id, title, start_time, end_time, description")
        .eq("project_id", projectId)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

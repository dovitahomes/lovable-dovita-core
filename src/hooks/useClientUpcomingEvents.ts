import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientUpcomingEvents(projectId: string | null) {
  return useQuery({
    queryKey: ["client-upcoming-events", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, start_at, end_at, notes")
        .eq("project_id", projectId)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

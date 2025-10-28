import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNextEvent(projectId: string | null) {
  return useQuery({
    queryKey: ["next-event", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, start_at, end_at, notes")
        .eq("project_id", projectId)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

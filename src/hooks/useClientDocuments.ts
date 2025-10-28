import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientDocuments(projectId: string | null, limit = 5) {
  return useQuery({
    queryKey: ["client-documents", projectId, limit],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("id, nombre, file_type, created_at, file_url, file_size")
        .eq("project_id", projectId)
        .eq("visibilidad", "cliente")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

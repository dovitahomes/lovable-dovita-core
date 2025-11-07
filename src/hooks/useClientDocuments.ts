import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch client-visible documents from v_client_documents view
 * Uses the view which already filters by visibilidad = 'cliente'
 */
export function useClientDocuments(projectId: string | null, limit = 5) {
  return useQuery({
    queryKey: ["client-documents", projectId, limit],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("v_client_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

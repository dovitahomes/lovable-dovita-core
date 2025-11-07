import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch client-visible photos from v_client_photos view
 * Uses the view which already filters by visibilidad = 'cliente'
 */
export function useClientPhotos(projectId: string | null, limit = 6) {
  return useQuery({
    queryKey: ["client-photos", projectId, limit],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("v_client_photos")
        .select("*")
        .eq("project_id", projectId)
        .order("fecha_foto", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

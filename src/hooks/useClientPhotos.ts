import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientPhotos(projectId: string | null, limit = 6) {
  return useQuery({
    queryKey: ["client-photos", projectId, limit],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("construction_photos")
        .select("id, file_url, descripcion, fecha_foto")
        .eq("project_id", projectId)
        .eq("visibilidad", "cliente")
        .order("fecha_foto", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

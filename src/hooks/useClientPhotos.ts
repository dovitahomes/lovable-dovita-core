import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage-helpers";

/**
 * Hook to fetch client-visible photos from v_client_photos view
 * Uses the view which already filters by visibilidad = 'cliente'
 * Returns photos with signed URLs for secure access
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
      
      // Generate signed URLs for each photo
      const photosWithSignedUrls = await Promise.all(
        (data || []).map(async (photo) => {
          try {
            const { url } = await getSignedUrl({
              bucket: 'project_photos',
              path: photo.file_url,
              expiresInSeconds: 3600 // 1 hour
            });
            return { ...photo, url };
          } catch (err) {
            console.error(`Error generating signed URL for photo ${photo.id}:`, err);
            return { ...photo, url: null };
          }
        })
      );

      return photosWithSignedUrls;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

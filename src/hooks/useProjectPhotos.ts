import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage-helpers";
import { useAuth } from "@/app/auth/AuthProvider";

/**
 * Hook unificado para fotos de proyecto
 * - Cliente: lee desde v_client_photos (solo visibilidad='cliente')
 * - Staff/Admin: lee desde construction_photos (todos los registros)
 */
export function useProjectPhotos(projectId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["project-photos", projectId, user?.id],
    queryFn: async () => {
      if (!projectId) return [];

      // Determinar si es cliente
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user?.id || '')
        .limit(1)
        .single();
      
      const isClient = userRoles?.role_name === 'cliente';
      
      // Cliente: usar vista filtrada
      if (isClient) {
        const { data, error } = await supabase
          .from("v_client_photos")
          .select("*")
          .eq("project_id", projectId)
          .order("fecha_foto", { ascending: false });

        if (error) throw error;
        
        // Generate signed URLs
        const photosWithUrls = await Promise.all(
          (data || []).map(async (photo) => {
            try {
              const { url } = await getSignedUrl({
                bucket: 'project_photos',
                path: photo.file_url,
                expiresInSeconds: 3600
              });
              return { ...photo, url };
            } catch (err) {
              console.error(`Error generating signed URL for photo ${photo.id}:`, err);
              return { ...photo, url: null };
            }
          })
        );
        
        return photosWithUrls;
      }
      
      // Staff/Admin: usar tabla operativa
      const { data, error } = await supabase
        .from("construction_photos")
        .select("*")
        .eq("project_id", projectId)
        .order("fecha_foto", { ascending: false });

      if (error) throw error;
      
      // Generate signed URLs
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          try {
            const { url } = await getSignedUrl({
              bucket: 'project_photos',
              path: photo.file_url,
              expiresInSeconds: 3600
            });
            return { ...photo, url };
          } catch (err) {
            console.error(`Error generating signed URL for photo ${photo.id}:`, err);
            return { ...photo, url: null };
          }
        })
      );
      
      return photosWithUrls;
    },
    enabled: !!projectId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

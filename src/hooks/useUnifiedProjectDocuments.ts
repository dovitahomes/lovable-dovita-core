import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage-helpers";
import { useAuth } from "@/app/auth/AuthProvider";

export interface UnifiedProjectDocument {
  id: string;
  project_id: string;
  nombre: string;
  etiqueta?: string | null;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  created_at: string;
  tipo_carpeta?: string;
  visibilidad?: string;
  url?: string; // Signed URL
}

/**
 * Hook unificado para documentos de proyecto
 * - Cliente: lee desde v_client_documents (solo visibilidad='cliente')
 * - Staff/Admin: lee desde documents (todos los registros)
 */
export function useUnifiedProjectDocuments(projectId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unified-project-documents', projectId, user?.id],
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
          .from('v_client_documents')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Generate signed URLs
        const docsWithUrls = await Promise.all(
          (data || []).map(async (doc) => {
            try {
              const { url } = await getSignedUrl({
                bucket: 'project_docs',
                path: doc.file_url,
                expiresInSeconds: 3600
              });
              return { ...doc, url };
            } catch (err) {
              console.error(`Error generating signed URL for document ${doc.id}:`, err);
              return { ...doc, url: null };
            }
          })
        );
        
        return docsWithUrls as UnifiedProjectDocument[];
      }
      
      // Staff/Admin: usar tabla operativa
      const { data, error } = await supabase
        .from('documents')
        .select('id, project_id, nombre, etiqueta, file_url, file_type, file_size, created_at, tipo_carpeta, visibilidad')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Generate signed URLs
      const docsWithUrls = await Promise.all(
        (data || []).map(async (doc) => {
          try {
            const { url } = await getSignedUrl({
              bucket: 'project_docs',
              path: doc.file_url,
              expiresInSeconds: 3600
            });
            return { ...doc, url };
          } catch (err) {
            console.error(`Error generating signed URL for document ${doc.id}:`, err);
            return { ...doc, url: null };
          }
        })
      );
      
      return docsWithUrls as UnifiedProjectDocument[];
    },
    enabled: !!projectId && !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

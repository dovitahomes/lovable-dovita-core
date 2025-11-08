import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage-helpers";

export interface ClientDocument {
  id: string;
  project_id: string;
  nombre: string;
  etiqueta: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  tipo_carpeta: string;
  url?: string; // Signed URL
}

export function useClientDocuments(projectId: string | null, tipoCarpeta?: string) {
  return useQuery({
    queryKey: ['client-documents', projectId, tipoCarpeta],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from('v_client_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (tipoCarpeta) {
        query = query.eq('tipo_carpeta', tipoCarpeta);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Generate signed URLs for each document
      const docsWithSignedUrls = await Promise.all(
        (data || []).map(async (doc) => {
          try {
            const { url } = await getSignedUrl({
              bucket: 'project_docs',
              path: doc.file_url,
              expiresInSeconds: 3600 // 1 hour
            });
            return { ...doc, url };
          } catch (err) {
            console.error(`Error generating signed URL for document ${doc.id}:`, err);
            return { ...doc, url: null };
          }
        })
      );

      return docsWithSignedUrls as ClientDocument[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

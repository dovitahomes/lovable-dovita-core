import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useClientDocuments(projectId: string | null, tipoCarpeta?: string) {
  return useQuery({
    queryKey: ['client-documents', projectId, tipoCarpeta],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from('documents')
        .select('id, project_id, nombre, etiqueta, file_url, file_type, file_size, created_at, tipo_carpeta')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (tipoCarpeta) {
        query = query.eq('tipo_carpeta', tipoCarpeta);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClientDocument[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

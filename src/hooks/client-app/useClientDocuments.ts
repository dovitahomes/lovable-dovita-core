import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

export function useClientDocuments(projectId: string | null) {
  return useQuery({
    queryKey: ['client-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Usar vista que filtra por visibilidad = 'cliente'
      const { data, error } = await supabase
        .from('v_client_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export function useClientProjectMembers(projectId: string | null) {
  const query = useQuery({
    queryKey: ['client-project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('v_client_project_members')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        throw new Error(`No se pudieron cargar los miembros del proyecto: ${error.message}`);
      }

      return (data || []) as ProjectMember[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

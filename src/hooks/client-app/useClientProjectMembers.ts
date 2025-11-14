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

      // Get project collaborators
      const { data: collaborators, error: collabError } = await supabase
        .from('project_collaborators')
        .select('user_id, created_at')
        .eq('project_id', projectId);

      if (collabError) {
        throw new Error(`No se pudieron cargar los miembros del proyecto: ${collabError.message}`);
      }

      if (!collaborators || collaborators.length === 0) return [];

      // Get user profiles for all collaborators
      const userIds = collaborators.map(c => c.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      return collaborators.map(collab => {
        const profile = profiles?.find(p => p.id === collab.user_id);
        return {
          user_id: collab.user_id,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          avatar_url: profile?.avatar_url || null,
          role: 'colaborador',
          created_at: collab.created_at,
        };
      }) as ProjectMember[];
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'admin' | 'colaborador' | 'viewer';
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export function useProjectCollaborators(projectId: string) {
  return useQuery({
    queryKey: ['project-collaborators', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profile data separately
      const userIds = data?.map(c => c.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return data.map(c => ({
        ...c,
        profiles: profileMap.get(c.user_id),
      })) as ProjectCollaborator[];
    },
    enabled: !!projectId,
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) => {
      const { error } = await supabase
        .from('project_collaborators')
        .insert({ project_id: projectId, user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-collaborators', variables.projectId] });
      toast.success("Colaborador agregado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-collaborators', data.projectId] });
      toast.success("Colaborador removido");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

export function useCheckCollaboratorAccess(projectId: string) {
  return useQuery({
    queryKey: ['collaborator-access', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!projectId,
  });
}

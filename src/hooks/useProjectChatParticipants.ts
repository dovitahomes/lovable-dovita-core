import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatParticipant {
  id: string;
  project_id: string;
  user_id: string;
  participant_type: 'client' | 'sales_advisor' | 'collaborator';
  joined_at: string;
  show_history_from: string | null;
  is_active: boolean;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

// Hook para obtener participantes del chat
export function useProjectChatParticipants(projectId: string) {
  return useQuery({
    queryKey: ['project-chat-participants', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_chat_participants')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch profile data
      const userIds = data?.map(p => p.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return data.map(p => ({
        ...p,
        profiles: profileMap.get(p.user_id),
      })) as ChatParticipant[];
    },
    enabled: !!projectId,
  });
}

// Hook para añadir colaborador al chat manualmente
export function useAddChatParticipant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      userId, 
      showFullHistory = false 
    }: { 
      projectId: string; 
      userId: string; 
      showFullHistory?: boolean;
    }) => {
      const { error } = await supabase
        .from('project_chat_participants')
        .insert({
          project_id: projectId,
          user_id: userId,
          participant_type: 'collaborator',
          show_history_from: showFullHistory ? null : new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['project-chat-participants', variables.projectId] 
      });
      toast.success("Participante añadido al chat");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

// Hook para dar acceso completo al historial
export function useGrantFullChatHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await supabase.rpc('grant_full_chat_history', {
        p_project_id: projectId,
        p_user_id: userId,
      });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['project-chat-participants', variables.projectId] 
      });
      toast.success("Acceso completo al historial concedido");
    },
  });
}

// Hook para remover del chat
export function useRemoveFromChat() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await supabase.rpc('remove_from_chat', {
        p_project_id: projectId,
        p_user_id: userId,
      });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['project-chat-participants', variables.projectId] 
      });
      toast.success("Participante removido del chat");
    },
  });
}

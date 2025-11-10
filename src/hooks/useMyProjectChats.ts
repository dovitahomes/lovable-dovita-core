import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectChatInfo {
  project_id: string;
  participant_type: 'client' | 'sales_advisor' | 'collaborator';
  joined_at: string;
  projects: {
    id: string;
    client_id: string;
    status: string;
    clients: {
      name: string;
    };
  };
  unread_count?: number;
  last_message_at?: string;
}

export function useMyProjectChats() {
  return useQuery({
    queryKey: ['my-project-chats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Obtener proyectos donde el usuario es participante del chat
      const { data, error } = await supabase
        .from('project_chat_participants')
        .select(`
          project_id,
          participant_type,
          joined_at,
          projects (
            id,
            client_id,
            status,
            clients (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Para cada proyecto, obtener el último mensaje y contar no leídos
      const chatsWithMetadata = await Promise.all(
        (data || []).map(async (chat) => {
          // Obtener último mensaje
          const { data: lastMessage } = await supabase
            .from('project_messages')
            .select('created_at')
            .eq('project_id', chat.project_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // TODO: Implementar lógica de mensajes no leídos cuando agregues la tabla de "read receipts"
          
          return {
            ...chat,
            last_message_at: lastMessage?.created_at || chat.joined_at,
            unread_count: 0, // Placeholder
          } as ProjectChatInfo;
        })
      );

      // Ordenar por último mensaje
      return chatsWithMetadata.sort((a, b) => 
        new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime()
      );
    },
  });
}

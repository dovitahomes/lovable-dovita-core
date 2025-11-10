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
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: string | null;
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

      // Para cada proyecto, obtener metadata del último mensaje y contar no leídos
      const chatsWithMetadata = await Promise.all(
        (data || []).map(async (chat) => {
          // Obtener último mensaje con información del sender
          const { data: lastMessage } = await supabase
            .from('project_messages')
            .select(`
              created_at,
              message,
              sender:profiles!project_messages_sender_id_fkey(full_name)
            `)
            .eq('project_id', chat.project_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Obtener contador de mensajes no leídos usando la función RPC
          const { data: unreadCount, error: countError } = await (supabase.rpc as any)(
            'get_unread_message_count',
            {
              p_project_id: chat.project_id,
              p_user_id: user.id
            }
          );

          if (countError) {
            console.error('Error getting unread count:', countError);
          }

          // Transformar sender si viene como array
          const sender = lastMessage?.sender 
            ? (Array.isArray(lastMessage.sender) ? lastMessage.sender[0] : lastMessage.sender)
            : null;
          
          return {
            ...chat,
            last_message_at: lastMessage?.created_at || null,
            last_message_preview: lastMessage?.message 
              ? (lastMessage.message.length > 50 
                  ? `${lastMessage.message.substring(0, 50)}...` 
                  : lastMessage.message)
              : null,
            last_message_sender: sender?.full_name || null,
            unread_count: unreadCount || 0,
          } as ProjectChatInfo;
        })
      );

      // Ordenar por último mensaje (más recientes primero)
      return chatsWithMetadata.sort((a, b) => {
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      });
    },
    refetchInterval: 5000, // Refetch every 5 seconds to update counters and last messages
  });
}

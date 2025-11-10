import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useQueryClient } from "@tanstack/react-query";

export interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  attachments: Array<{ name: string; url: string; size: number; type: string }>;
  status: 'sent' | 'delivered' | 'read';
  is_edited: boolean;
  edited_at: string | null;
  replied_to_id: string | null;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export default function useProjectChat(projectId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sending, setSending] = useState(false);
  const isMounted = useIsMounted();
  const queryClient = useQueryClient();

  const loadMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Obtener configuración de historial del participante
      const { data: participant } = await supabase
        .from('project_chat_participants')
        .select('show_history_from')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      // Construir query de mensajes con información completa del sender
      let query: any = supabase
        .from('project_messages')
        .select(`
          id,
          project_id,
          sender_id,
          message,
          attachments,
          status,
          is_edited,
          edited_at,
          replied_to_id,
          created_at,
          sender:profiles!project_messages_sender_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      // Si el participante tiene restricción de historial, aplicarla
      if (participant?.show_history_from) {
        query = query.gte('created_at', participant.show_history_from);
      }

      const { data, error: loadError } = await query;

      if (loadError) {
        throw new Error(`No se pudieron cargar los mensajes: ${loadError.message}`);
      }

      if (isMounted.current) {
        // Transform data to ensure sender is an object
        const transformedData = (data || []).map((msg: any) => ({
          ...msg,
          sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
          attachments: msg.attachments || []
        }));
        setMessages(transformedData);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [projectId, isMounted]);

  const sendMessage = useCallback(async (
    text: string, 
    attachments?: Array<{ name: string; url: string; size: number; type: string }>
  ) => {
    if (!projectId || !text.trim()) return;

    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No estás autenticado');
      }

      const { error: insertError } = await (supabase
        .from('project_messages') as any)
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message: text.trim(),
          attachments: attachments || [],
          status: 'sent'
        });

      if (insertError) {
        throw new Error(`No se pudo enviar el mensaje: ${insertError.message}`);
      }

      // Message will be added via realtime subscription
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Error al enviar mensaje'));
      }
      throw err; // Re-throw so caller can handle
    } finally {
      if (isMounted.current) {
        setSending(false);
      }
    }
  }, [projectId, isMounted]);

  // Load messages on mount or project change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Mark messages as read when viewing the chat
  useEffect(() => {
    const markAsRead = async () => {
      if (!projectId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark all messages in this project as read for this user
      await (supabase.rpc as any)('mark_message_as_read', {
        p_project_id: projectId,
        p_user_id: user.id
      });

      // Invalidate my-project-chats query to update unread counters
      queryClient.invalidateQueries({ queryKey: ['my-project-chats'] });
    };

    // Mark as read after a short delay to ensure messages are loaded
    const timer = setTimeout(markAsRead, 500);
    return () => clearTimeout(timer);
  }, [projectId, messages.length, queryClient]);

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`pm:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          if (isMounted.current) {
            // Fetch complete message with sender info
            const { data } = await (supabase
              .from('project_messages') as any)
              .select(`
                id,
                project_id,
                sender_id,
                message,
                attachments,
                status,
                is_edited,
                edited_at,
                replied_to_id,
                created_at,
                sender:profiles!project_messages_sender_id_fkey(
                  id,
                  full_name,
                  email,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const transformedMsg = {
                ...data,
                sender: Array.isArray(data.sender) ? data.sender[0] : data.sender,
                attachments: data.attachments || []
              };
              setMessages(prev => [...prev, transformedMsg as ChatMessage]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, isMounted]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: loadMessages,
  };
}

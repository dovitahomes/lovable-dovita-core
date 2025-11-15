import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useQueryClient } from "@tanstack/react-query";
import { useClientDataMode } from "@/contexts/client-app/ClientDataModeProvider";
import { mockChatMessages } from "@/lib/client-app/client-data";

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
  const { useMock } = useClientDataMode();

  const loadMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    // If in mock mode, return mock messages
    if (useMock) {
      const mockMsgs = mockChatMessages
        .filter(msg => msg.projectId === projectId)
        .map((msg, idx) => ({
          id: msg.id.toString(),
          project_id: msg.projectId,
          sender_id: msg.isClient ? 'client-mock' : 'team-mock',
          message: msg.content,
          attachments: [],
          status: msg.status as 'sent' | 'delivered' | 'read',
          is_edited: false,
          edited_at: null,
          replied_to_id: null,
          created_at: msg.timestamp,
          sender: {
            id: msg.isClient ? 'client-mock' : 'team-mock',
            full_name: msg.sender?.name || (msg.isClient ? 'Cliente' : 'Equipo'),
            email: 'mock@example.com',
            avatar_url: msg.sender?.avatar || null,
          }
        }));
      setMessages(mockMsgs as ChatMessage[]);
      setLoading(false);
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
  }, [projectId, isMounted, useMock]);

  const sendMessage = useCallback(async (
    text: string, 
    attachments?: Array<{ name: string; url: string; size: number; type: string }>
  ) => {
    if (!projectId || !text.trim()) return;

    // If in mock mode, add message locally without Supabase
    if (useMock) {
      const newMessage: ChatMessage = {
        id: `mock-${Date.now()}`,
        project_id: projectId,
        sender_id: 'client-mock',
        message: text.trim(),
        attachments: attachments || [],
        status: 'sent',
        is_edited: false,
        edited_at: null,
        replied_to_id: null,
        created_at: new Date().toISOString(),
        sender: {
          id: 'client-mock',
          full_name: 'Cliente',
          email: 'mock@example.com',
          avatar_url: null,
        }
      };
      setMessages(prev => [...prev, newMessage]);
      return;
    }

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
  }, [projectId, isMounted, useMock]);

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

  // Set up realtime subscription (only for real data, not mock) - MEJORADO
  useEffect(() => {
    if (!projectId || useMock) return;

    console.log('[Client Chat] Configurando Realtime para proyecto:', projectId);

    const channel = supabase
      .channel(`client-project-chat:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`
      }, async (payload) => {
        console.log('[Client Chat] Nuevo mensaje Realtime:', payload.new);

        if (isMounted.current) {
          // Cargar mensaje completo con información del sender
          const { data: newMessage } = await supabase
            .from('project_messages')
            .select(`
              id, project_id, sender_id, message, attachments, 
              status, is_edited, edited_at, replied_to_id, created_at,
              sender:profiles!project_messages_sender_id_fkey(
                id, full_name, email, avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            const transformedMsg: ChatMessage = {
              id: newMessage.id,
              project_id: newMessage.project_id,
              sender_id: newMessage.sender_id,
              message: newMessage.message,
              attachments: (newMessage.attachments as any) || [],
              status: (newMessage.status as 'sent' | 'delivered' | 'read') || 'sent',
              is_edited: newMessage.is_edited || false,
              edited_at: newMessage.edited_at || undefined,
              replied_to_id: newMessage.replied_to_id || undefined,
              created_at: newMessage.created_at,
              sender: {
                id: (newMessage.sender as any)?.id || newMessage.sender_id,
                full_name: (newMessage.sender as any)?.full_name || 'Usuario',
                email: (newMessage.sender as any)?.email || '',
                avatar_url: (newMessage.sender as any)?.avatar_url
              }
            };

            // Evitar duplicados
            setMessages(prev => {
              const exists = prev.some(m => m.id === transformedMsg.id);
              if (exists) return prev;
              return [...prev, transformedMsg];
            });
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        console.log('[Client Chat] Mensaje actualizado:', payload.new);
        
        if (isMounted.current) {
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id 
              ? { 
                  ...msg, 
                  status: (payload.new.status as 'sent' | 'delivered' | 'read') || msg.status,
                  is_edited: payload.new.is_edited || msg.is_edited
                }
              : msg
          ));
        }
      })
      .subscribe((status) => {
        console.log('[Client Chat] Estado de suscripción:', status);
      });

    return () => {
      console.log('[Client Chat] Limpiando suscripción Realtime');
      supabase.removeChannel(channel);
    };
  }, [projectId, useMock]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: loadMessages,
  };
}

/**
 * useERPProjectChat - Hook específico para el chat del ERP
 * 
 * A diferencia de useProjectChat, este hook:
 * - NO depende de ClientDataModeProvider
 * - Siempre consulta Supabase (sin modo mock)
 * - Optimizado para el módulo Mis Chats del ERP
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  status: 'sent' | 'delivered' | 'read';
  is_edited: boolean;
  edited_at?: string;
  replied_to_id?: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export function useERPProjectChat(projectId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  // Función para transformar datos de Supabase a ChatMessage
  const transformMessage = useCallback((msg: any): ChatMessage => {
    return {
      id: msg.id,
      project_id: msg.project_id,
      sender_id: msg.sender_id,
      message: msg.message,
      attachments: msg.attachments,
      status: msg.status || 'sent',
      is_edited: msg.is_edited || false,
      edited_at: msg.edited_at,
      replied_to_id: msg.replied_to_id,
      created_at: msg.created_at,
      sender: {
        id: msg.sender?.id || msg.sender_id,
        full_name: msg.sender?.full_name || 'Usuario',
        email: msg.sender?.email || '',
        avatar_url: msg.sender?.avatar_url
      }
    };
  }, []);

  // Cargar mensajes desde Supabase
  const loadMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener configuración de historial del participante
      const { data: participant } = await supabase
        .from('project_chat_participants')
        .select('show_history_from')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      // Construir query base
      let query = supabase
        .from('project_messages')
        .select(`
          id, project_id, sender_id, message, attachments, 
          status, is_edited, edited_at, replied_to_id, created_at,
          sender:profiles!project_messages_sender_id_fkey(
            id, full_name, email, avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      // Aplicar filtro de historial si existe
      if (participant?.show_history_from) {
        query = query.gte('created_at', participant.show_history_from);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformedMessages = (data || []).map(transformMessage);
      setMessages(transformedMessages);

      console.log('[ERP Chat] Mensajes cargados:', transformedMessages.length);
    } catch (err: any) {
      console.error('[ERP Chat] Error cargando mensajes:', err);
      setError(err.message);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  }, [projectId, transformMessage]);

  // Enviar mensaje
  const sendMessage = useCallback(async (
    text: string,
    attachments?: Array<{ name: string; url: string; size: number; type: string }>
  ) => {
    if (!projectId || !text.trim()) return;

    try {
      setSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const { data: newMessage, error: insertError } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message: text.trim(),
          attachments: attachments || null,
          status: 'sent'
        })
        .select(`
          id, project_id, sender_id, message, attachments, 
          status, is_edited, edited_at, replied_to_id, created_at,
          sender:profiles!project_messages_sender_id_fkey(
            id, full_name, email, avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      console.log('[ERP Chat] Mensaje enviado:', newMessage.id);

      // Agregar mensaje localmente (Realtime lo duplicará, pero lo manejaremos)
      const transformedMessage = transformMessage(newMessage);
      setMessages(prev => [...prev, transformedMessage]);

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['my-project-chats'] });

      return newMessage.id;
    } catch (err: any) {
      console.error('[ERP Chat] Error enviando mensaje:', err);
      toast.error('Error al enviar mensaje');
      throw err;
    } finally {
      setSending(false);
    }
  }, [projectId, transformMessage, queryClient]);

  // Cargar mensajes al montar o cambiar proyecto
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Marcar mensajes como leídos
  useEffect(() => {
    if (!projectId || messages.length === 0) return;

    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Marcar todos los mensajes no leídos
      const unreadMessages = messages.filter(m => 
        m.sender_id !== user.id && m.status !== 'read'
      );

      for (const msg of unreadMessages) {
        await supabase.rpc('mark_message_as_read', { p_message_id: msg.id });
      }

      if (unreadMessages.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['my-project-chats'] });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectId, messages, queryClient]);

  // Suscripción a Realtime para nuevos mensajes
  useEffect(() => {
    if (!projectId) return;

    console.log('[ERP Chat] Configurando Realtime para proyecto:', projectId);

    const channel = supabase
      .channel(`erp-project-chat:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`
      }, async (payload) => {
        console.log('[ERP Chat] Nuevo mensaje Realtime:', payload.new);

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
          const transformedMessage = transformMessage(newMessage);
          
          // Evitar duplicados (el mensaje que enviamos ya está en el estado)
          setMessages(prev => {
            const exists = prev.some(m => m.id === transformedMessage.id);
            if (exists) return prev;
            return [...prev, transformedMessage];
          });

          // Invalidar queries
          queryClient.invalidateQueries({ queryKey: ['my-project-chats'] });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        console.log('[ERP Chat] Mensaje actualizado:', payload.new);
        
        setMessages(prev => prev.map(msg => 
          msg.id === payload.new.id 
            ? { ...msg, status: payload.new.status, is_edited: payload.new.is_edited }
            : msg
        ));
      })
      .subscribe((status) => {
        console.log('[ERP Chat] Estado de suscripción:', status);
      });

    return () => {
      console.log('[ERP Chat] Limpiando suscripción Realtime');
      supabase.removeChannel(channel);
    };
  }, [projectId, transformMessage, queryClient]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: loadMessages
  };
}

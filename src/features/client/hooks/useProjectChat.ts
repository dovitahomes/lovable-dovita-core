import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMounted } from "@/hooks/useIsMounted";

export interface ChatMessage {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function useProjectChat(projectId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sending, setSending] = useState(false);
  const isMounted = useIsMounted();

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

      // Construir query de mensajes
      let query = supabase
        .from('project_messages')
        .select('id, sender_id, message, created_at')
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
        setMessages(data || []);
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

  const sendMessage = useCallback(async (text: string) => {
    if (!projectId || !text.trim()) return;

    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No estás autenticado');
      }

      const { error: insertError } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: user.id,
          message: text.trim(),
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
        (payload) => {
          if (isMounted.current) {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
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

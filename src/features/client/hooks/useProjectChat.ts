import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    email: string;
    full_name?: string;
  };
}

export function useProjectChat(projectId: string | null) {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!projectId) return;

    loadMessages();

    const channel = supabase
      .channel(`project_messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', payload.new.sender_id)
            .single();

          const newMsg = {
            ...payload.new,
            sender: senderData || undefined
          } as ProjectMessage;

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadMessages = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender: senderData || undefined
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentUserId || !projectId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: currentUserId,
          message: text.trim()
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      throw error;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    currentUserId,
    sendMessage,
    refetch: loadMessages,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MailchimpEmail {
  id: string;
  message_id: string;
  conversation_id: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  lead_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface EmailFilters {
  read?: boolean;
  starred?: boolean;
  archived?: boolean;
  search?: string;
}

export function useMailchimpEmails(filters: EmailFilters = {}) {
  const queryClient = useQueryClient();

  // Obtener lista de emails
  const { data: emails, isLoading } = useQuery({
    queryKey: ['mailchimp-emails', filters],
    queryFn: async () => {
      let query = supabase
        .from('mailchimp_emails')
        .select('*')
        .order('received_at', { ascending: false });

      // Aplicar filtros
      if (filters.read !== undefined) {
        query = query.eq('read', filters.read);
      }
      if (filters.starred !== undefined) {
        query = query.eq('starred', filters.starred);
      }
      if (filters.archived !== undefined) {
        query = query.eq('archived', filters.archived);
      }
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,from_email.ilike.%${filters.search}%,body_text.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as MailchimpEmail[];
    },
  });

  // Marcar como leído/no leído
  const toggleRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase
        .from('mailchimp_emails')
        .update({ read })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-emails'] });
    },
    onError: (error: Error) => {
      console.error('Error updating email:', error);
      toast.error(`Error al actualizar email: ${error.message}`);
    },
  });

  // Marcar como destacado/no destacado
  const toggleStarred = useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const { error } = await supabase
        .from('mailchimp_emails')
        .update({ starred })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-emails'] });
    },
    onError: (error: Error) => {
      console.error('Error updating email:', error);
      toast.error(`Error al actualizar email: ${error.message}`);
    },
  });

  // Archivar/desarchivar
  const toggleArchived = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('mailchimp_emails')
        .update({ archived })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-emails'] });
      toast.success('Email archivado');
    },
    onError: (error: Error) => {
      console.error('Error updating email:', error);
      toast.error(`Error al actualizar email: ${error.message}`);
    },
  });

  const unreadCount = emails?.filter(e => !e.read && !e.archived).length || 0;
  const starredCount = emails?.filter(e => e.starred && !e.archived).length || 0;

  return {
    emails: emails || [],
    isLoading,
    unreadCount,
    starredCount,
    toggleRead: toggleRead.mutate,
    toggleStarred: toggleStarred.mutate,
    toggleArchived: toggleArchived.mutate,
    isUpdating: toggleRead.isPending || toggleStarred.isPending || toggleArchived.isPending,
  };
}

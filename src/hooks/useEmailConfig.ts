import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type EmailProvider = Database['public']['Enums']['email_provider'];

interface EmailConfig {
  id: string;
  proveedor: EmailProvider;
  mailchimp_api_key: string | null;
  mailchimp_server_prefix: string | null;
  mailchimp_default_list_id: string | null;
  mailchimp_total_seats: number;
  mailchimp_generic_email: string | null;
  resend_api_key: string | null;
  resend_from_domain: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmailConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_config')
        .select('*')
        .single();

      if (error) throw error;
      return data as EmailConfig;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<EmailConfig>) => {
      if (!config?.id) {
        throw new Error('No se encontró configuración de email');
      }

      const { data, error } = await supabase
        .from('email_config')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
      toast.success('Configuración actualizada correctamente');
    },
    onError: (error: Error) => {
      console.error('Error updating email config:', error);
      toast.error(`Error al actualizar configuración: ${error.message}`);
    },
  });

  return {
    config,
    isLoading,
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  };
}

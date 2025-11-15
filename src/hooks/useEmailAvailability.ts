import { useMemo } from "react";
import { useEmailConfig } from "./useEmailConfig";
import { Database } from "@/integrations/supabase/types";

type EmailProvider = Database['public']['Enums']['email_provider'];

interface EmailAvailability {
  hasEmailConfigured: boolean;
  provider: EmailProvider;
  isLoading: boolean;
}

export function useEmailAvailability(): EmailAvailability {
  const { config, isLoading } = useEmailConfig();

  const hasEmailConfigured = useMemo(() => {
    if (!config) return false;
    
    // Si el proveedor es 'none', no hay email configurado
    if (config.proveedor === 'none') return false;
    
    // Para Mailchimp, verificar que tenga al menos 1 asiento activo
    if (config.proveedor === 'mailchimp') {
      return (config.mailchimp_total_seats || 0) > 0;
    }
    
    // Para Resend, verificar que tenga API key y dominio
    if (config.proveedor === 'resend') {
      return !!(config.resend_api_key && config.resend_from_domain);
    }
    
    return false;
  }, [config]);

  return {
    hasEmailConfigured,
    provider: config?.proveedor || 'none',
    isLoading,
  };
}

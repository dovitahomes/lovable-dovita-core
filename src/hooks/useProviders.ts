import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface Provider {
  id: string;
  code_short: string;
  name: string;
  fiscales_json?: {
    rfc?: string;
    razon_social?: string;
    direccion_fiscal?: string;
  };
  contacto_json?: {
    email?: string;
    telefono?: string;
    contacto_nombre?: string;
  };
  terms_json?: {
    payment_terms?: string;
    dias_credito?: number;
  };
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("activo", true)
        .order("name");

      if (error) throw error;
      return data as Provider[];
    },
    ...CACHE_CONFIG.catalogs,
  });
}

export function useProviderById(id?: string) {
  return useQuery({
    queryKey: ["provider", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Provider;
    },
    enabled: !!id,
  });
}

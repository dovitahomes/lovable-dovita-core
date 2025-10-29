import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CorporateContent = {
  id: string;
  nombre_empresa: string;
  logo_url: string | null;
  isotipo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  email_principal: string | null;
  email_secundario: string | null;
  telefono_principal: string | null;
  telefono_secundario: string | null;
  direccion: string | null;
  sitio_web: string | null;
};

export function useCorporateContent() {
  return useQuery({
    queryKey: ['corporate-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contenido_corporativo')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CorporateContent | null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAuthClientId() {
  return useQuery({
    queryKey: ['auth-client-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Buscar en la tabla clients por email
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('email', user.email)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching client:', error);
        return null;
      }
      
      return data;
    },
  });
}

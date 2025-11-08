import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export function useClientsList(search: string = "") {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      // LOGGING: Verificar sesión antes de consultar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[useClientsList] 🔍 Session check:', {
        has_session: !!session,
        user_id: session?.user?.id,
        error: sessionError?.message
      });
      
      if (!session) {
        console.error('[useClientsList] ❌ No session available');
        throw new Error('No hay sesión activa');
      }
      
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      console.log('[useClientsList] 📡 Executing query to clients table...');
      const { data, error } = await query;
      
      console.log('[useClientsList] 📊 Query result:', {
        success: !error,
        count: data?.length || 0,
        error_message: error?.message,
        error_code: error?.code,
        error_details: error?.details
      });
      
      if (error) {
        console.error('[useClientsList] ❌ Query failed:', error);
        throw error;
      }
      
      return data;
    },
    ...CACHE_CONFIG.active,
  });
}

export function useClientById(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useClientProjects(clientId: string) {
  return useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, sucursales(nombre)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function useUpsertClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      if (id) {
        const { error } = await supabase
          .from('clients')
          .update(data)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
      }
      toast.success(variables.id ? "Cliente actualizado" : "Cliente creado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

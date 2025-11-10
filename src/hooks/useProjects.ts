import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export function useProjectsList({ search = "", status = "" }: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['projects', search, status],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*, clients(name), sucursales(nombre)')
        .order('created_at', { ascending: false });
      
      if (status && status !== "all") {
        query = query.eq('status', status as any);
      }
      
      if (search) {
        query = query.or(`clients.name.ilike.%${search}%,project_name.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIG.active,
  });
}

export function useProjectById(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name, email, phone), sucursales(nombre)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpsertProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      if (id) {
        const { error } = await supabase
          .from('projects')
          .update(data)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
      }
      toast.success(variables.id ? "Proyecto actualizado" : "Proyecto creado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

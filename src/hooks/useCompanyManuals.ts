import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CompanyManual {
  id: string;
  titulo: string;
  descripcion?: string;
  file_path: string;
  categoria?: string;
  visible_para_roles: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useCompanyManuals(categoria?: string, searchTerm?: string) {
  return useQuery({
    queryKey: ['company-manuals', categoria, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('company_manuals')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (categoria && categoria !== 'todos') {
        query = query.eq('categoria', categoria);
      }
      
      if (searchTerm) {
        query = query.or(`titulo.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as CompanyManual[];
    },
  });
}

export function useCompanyManualById(id: string) {
  return useQuery({
    queryKey: ['company-manual', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_manuals')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as CompanyManual;
    },
    enabled: !!id,
  });
}

export function useCreateCompanyManual() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (manual: Omit<CompanyManual, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('company_manuals')
        .insert({
          ...manual,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-manuals'] });
      toast({ description: "Manual agregado exitosamente" });
    },
    onError: (error) => {
      console.error('Error creating manual:', error);
      toast({ 
        variant: "destructive",
        description: "Error al agregar manual" 
      });
    },
  });
}

export function useUpdateCompanyManual() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompanyManual> }) => {
      const { data, error } = await supabase
        .from('company_manuals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-manuals'] });
      toast({ description: "Manual actualizado" });
    },
    onError: (error) => {
      console.error('Error updating manual:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar manual" 
      });
    },
  });
}

export function useDeleteCompanyManual() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_manuals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-manuals'] });
      toast({ description: "Manual eliminado" });
    },
    onError: (error) => {
      console.error('Error deleting manual:', error);
      toast({ 
        variant: "destructive",
        description: "Error al eliminar manual" 
      });
    },
  });
}

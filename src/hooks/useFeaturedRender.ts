import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FeaturedRender {
  id: string;
  mes_ano: string;
  imagen_path: string;
  titulo: string;
  autor?: string;
  proyecto_id?: string;
  caption?: string;
  active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useFeaturedRender(mesAno?: string) {
  // Si no se proporciona mes_ano, usar el actual
  const currentMesAno = mesAno || new Date().toISOString().slice(0, 7); // '2025-11'
  
  return useQuery({
    queryKey: ['featured-render', currentMesAno],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_renders')
        .select('*')
        .eq('mes_ano', currentMesAno)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as FeaturedRender | null;
    },
  });
}

export function useAllFeaturedRenders() {
  return useQuery({
    queryKey: ['all-featured-renders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_renders')
        .select('*')
        .order('mes_ano', { ascending: false });
      
      if (error) throw error;
      return data as FeaturedRender[];
    },
  });
}

export function useCreateFeaturedRender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (render: Omit<FeaturedRender, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Desactivar otros renders del mismo mes
      await supabase
        .from('featured_renders')
        .update({ active: false })
        .eq('mes_ano', render.mes_ano);
      
      const { data, error } = await supabase
        .from('featured_renders')
        .insert({
          ...render,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['featured-render'] });
      queryClient.invalidateQueries({ queryKey: ['all-featured-renders'] });
      toast({ description: "Render del mes actualizado exitosamente" });
    },
    onError: (error) => {
      console.error('Error creating featured render:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar render del mes" 
      });
    },
  });
}

export function useUpdateFeaturedRender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeaturedRender> }) => {
      const { data, error } = await supabase
        .from('featured_renders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-render'] });
      queryClient.invalidateQueries({ queryKey: ['all-featured-renders'] });
      toast({ description: "Render actualizado" });
    },
    onError: (error) => {
      console.error('Error updating render:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar render" 
      });
    },
  });
}

export function useDeleteFeaturedRender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('featured_renders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-render'] });
      queryClient.invalidateQueries({ queryKey: ['all-featured-renders'] });
      toast({ description: "Render eliminado" });
    },
    onError: (error) => {
      console.error('Error deleting render:', error);
      toast({ 
        variant: "destructive",
        description: "Error al eliminar render" 
      });
    },
  });
}

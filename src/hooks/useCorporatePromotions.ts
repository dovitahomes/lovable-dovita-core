import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CorporatePromotion {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen_path?: string;
  fecha_inicio: string;
  fecha_fin: string;
  active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useCorporatePromotions() {
  return useQuery({
    queryKey: ['corporate-promotions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('corporate_promotions')
        .select('*')
        .eq('active', true)
        .lte('fecha_inicio', today)
        .gte('fecha_fin', today)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      return data as CorporatePromotion[];
    },
  });
}

export function useAllCorporatePromotions() {
  return useQuery({
    queryKey: ['all-corporate-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_promotions')
        .select('*')
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      return data as CorporatePromotion[];
    },
  });
}

export function useCreateCorporatePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promotion: Omit<CorporatePromotion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('corporate_promotions')
        .insert({
          ...promotion,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['all-corporate-promotions'] });
      toast({ description: "Promoción creada exitosamente" });
    },
    onError: (error) => {
      console.error('Error creating promotion:', error);
      toast({ 
        variant: "destructive",
        description: "Error al crear promoción" 
      });
    },
  });
}

export function useUpdateCorporatePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CorporatePromotion> }) => {
      const { data, error } = await supabase
        .from('corporate_promotions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['all-corporate-promotions'] });
      toast({ description: "Promoción actualizada" });
    },
    onError: (error) => {
      console.error('Error updating promotion:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar promoción" 
      });
    },
  });
}

export function useDeleteCorporatePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corporate_promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corporate-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['all-corporate-promotions'] });
      toast({ description: "Promoción eliminada" });
    },
    onError: (error) => {
      console.error('Error deleting promotion:', error);
      toast({ 
        variant: "destructive",
        description: "Error al eliminar promoción" 
      });
    },
  });
}

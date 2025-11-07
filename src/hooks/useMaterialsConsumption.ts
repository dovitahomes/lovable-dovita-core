import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaterialConsumption {
  id: string;
  stage_id: string;
  budget_item_id: string | null;
  quantity_used: number;
  unit_cost: number;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

/**
 * Hook para obtener consumo de materiales de una etapa
 */
export function useMaterialsConsumption(stageId?: string) {
  return useQuery({
    queryKey: ["materials-consumption", stageId],
    queryFn: async () => {
      if (!stageId) return [];

      const { data, error } = await supabase
        .from("materials_consumption" as any)
        .select(`
          *,
          budget_items:budget_item_id (
            descripcion,
            unidad,
            mayor_id,
            partida_id,
            subpartida_id
          )
        `)
        .eq("stage_id", stageId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as (MaterialConsumption & {
        budget_items?: any;
      })[];
    },
    enabled: !!stageId,
  });
}

/**
 * Hook para registrar consumo de material
 */
export function useRegisterMaterialConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      stage_id: string;
      budget_item_id: string;
      quantity_used: number;
      unit_cost: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("materials_consumption" as any)
        .insert({
          ...data,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials-consumption"] });
      queryClient.invalidateQueries({ queryKey: ["construction-progress"] });
      toast.success("Consumo registrado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al registrar consumo: " + error.message);
    },
  });
}

/**
 * Hook para eliminar consumo de material
 */
export function useDeleteMaterialConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("materials_consumption" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials-consumption"] });
      queryClient.invalidateQueries({ queryKey: ["construction-progress"] });
      toast.success("Consumo eliminado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

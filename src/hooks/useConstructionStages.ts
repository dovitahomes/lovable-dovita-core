import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConstructionStage {
  id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface ConstructionProgress {
  stage_id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  total_consumed: number;
  total_budgeted: number;
  consumption_pct: number;
  alert_80: boolean;
}

/**
 * Hook para obtener etapas de construcción de un proyecto
 */
export function useConstructionStages(projectId?: string) {
  return useQuery({
    queryKey: ["construction-stages", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("construction_stages" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ConstructionStage[];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook para obtener progreso de construcción con alertas
 */
export function useConstructionProgress(projectId?: string) {
  return useQuery({
    queryKey: ["construction-progress", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("v_construction_progress" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as ConstructionProgress[];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook para crear/actualizar etapa de construcción
 */
export function useUpsertConstructionStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: Partial<ConstructionStage> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (id) {
        const { error } = await supabase
          .from("construction_stages" as any)
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("construction_stages" as any)
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["construction-stages"] });
      queryClient.invalidateQueries({ queryKey: ["construction-progress"] });
      toast.success(variables.id ? "Etapa actualizada" : "Etapa creada");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

/**
 * Hook para eliminar etapa de construcción
 */
export function useDeleteConstructionStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("construction_stages" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["construction-stages"] });
      queryClient.invalidateQueries({ queryKey: ["construction-progress"] });
      toast.success("Etapa eliminada");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

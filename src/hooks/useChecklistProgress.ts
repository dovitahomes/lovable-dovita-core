import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChecklistProgress {
  total: number;
  completed: number;
  obligatorios: number;
  obligatoriosCompletos: number;
  porcentajeTotal: number;
  porcentajeObligatorios: number;
}

export function useChecklistProgress(projectId: string | null) {
  return useQuery({
    queryKey: ["checklist-progress", projectId],
    queryFn: async (): Promise<ChecklistProgress> => {
      if (!projectId) {
        return {
          total: 0,
          completed: 0,
          obligatorios: 0,
          obligatoriosCompletos: 0,
          porcentajeTotal: 0,
          porcentajeObligatorios: 0,
        };
      }

      const { data, error } = await supabase
        .from("required_documents")
        .select("subido, obligatorio")
        .eq("project_id", projectId);

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter((d) => d.subido).length || 0;
      const obligatorios = data?.filter((d) => d.obligatorio).length || 0;
      const obligatoriosCompletos = data?.filter((d) => d.obligatorio && d.subido).length || 0;

      return {
        total,
        completed,
        obligatorios,
        obligatoriosCompletos,
        porcentajeTotal: total > 0 ? (completed / total) * 100 : 0,
        porcentajeObligatorios: obligatorios > 0 ? (obligatoriosCompletos / obligatorios) * 100 : 0,
      };
    },
    enabled: !!projectId,
  });
}

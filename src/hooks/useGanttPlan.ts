import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type GanttItem = {
  id: string;
  gantt_id: string;
  major_id: string;
  start_date: string;
  end_date: string;
  order_index: number;
  tu_nodes?: {
    name: string;
    code: string;
  };
};

export type GanttMinistration = {
  id: string;
  gantt_id: string;
  date: string;
  label: string;
  alcance: string | null;
  order_index: number;
  percent: number | null;
  accumulated_percent: number | null;
};

export type GanttPlan = {
  id: string;
  project_id: string;
  type: "parametrico" | "ejecutivo";
  shared_with_construction: boolean;
  created_at: string;
  updated_at: string;
};

export function useGanttPlan(ganttId: string | null) {
  return useQuery({
    queryKey: ["gantt-plan", ganttId],
    queryFn: async () => {
      if (!ganttId) return null;

      const [planRes, itemsRes, ministrationsRes] = await Promise.all([
        supabase.from("gantt_plans").select("*").eq("id", ganttId).single(),
        supabase
          .from("gantt_items")
          .select("*, tu_nodes(name, code)")
          .eq("gantt_id", ganttId)
          .order("order_index"),
        supabase
          .from("gantt_ministrations")
          .select("*")
          .eq("gantt_id", ganttId)
          .order("order_index"),
      ]);

      if (planRes.error) throw planRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (ministrationsRes.error) throw ministrationsRes.error;

      return {
        plan: planRes.data as GanttPlan,
        items: (itemsRes.data || []) as GanttItem[],
        ministrations: (ministrationsRes.data || []) as GanttMinistration[],
      };
    },
    enabled: !!ganttId,
  });
}

export function useGanttPlanByProject(projectId: string | null, type: "parametrico" | "ejecutivo") {
  return useQuery({
    queryKey: ["gantt-plan-by-project", projectId, type],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("gantt_plans")
        .select("*")
        .eq("project_id", projectId)
        .eq("type", type)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as GanttPlan | null;
    },
    enabled: !!projectId,
  });
}

export function useUpsertGanttPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id?: string;
      project_id: string;
      type: "parametrico" | "ejecutivo";
      items: Omit<GanttItem, "id" | "gantt_id">[];
      ministrations: Omit<GanttMinistration, "id" | "gantt_id">[];
    }) => {
      let ganttId = params.id;

      if (!ganttId) {
        const { data: plan, error: planError } = await supabase
          .from("gantt_plans")
          .insert({
            project_id: params.project_id,
            type: params.type,
          })
          .select()
          .single();

        if (planError) throw planError;
        ganttId = plan.id;
      } else {
        const { error: updateError } = await supabase
          .from("gantt_plans")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", ganttId);

        if (updateError) throw updateError;
      }

      // Delete and reinsert items/ministrations
      await supabase.from("gantt_items").delete().eq("gantt_id", ganttId);
      await supabase.from("gantt_ministrations").delete().eq("gantt_id", ganttId);

      if (params.items.length > 0) {
        const { error: itemsError } = await supabase.from("gantt_items").insert(
          params.items.map((item) => ({ ...item, gantt_id: ganttId }))
        );
        if (itemsError) throw itemsError;
      }

      if (params.ministrations.length > 0) {
        const { error: ministrationsError } = await supabase
          .from("gantt_ministrations")
          .insert(params.ministrations.map((m) => ({ ...m, gantt_id: ganttId })));
        if (ministrationsError) throw ministrationsError;
      }

      return ganttId;
    },
    onSuccess: (ganttId, params) => {
      queryClient.invalidateQueries({ queryKey: ["gantt-plan", ganttId] });
      queryClient.invalidateQueries({ queryKey: ["gantt-plan-by-project", params.project_id] });
      toast.success("Cronograma guardado correctamente");
    },
    onError: (error: any) => {
      toast.error("Error al guardar: " + error.message);
    },
  });
}

export function useShareGanttWithConstruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ganttId: string) => {
      const { error } = await supabase
        .from("gantt_plans")
        .update({ shared_with_construction: true })
        .eq("id", ganttId);

      if (error) throw error;
    },
    onSuccess: (_, ganttId) => {
      queryClient.invalidateQueries({ queryKey: ["gantt-plan", ganttId] });
      toast.success("Cronograma compartido con Construcción");
    },
    onError: (error: any) => {
      toast.error("Error al compartir: " + error.message);
    },
  });
}

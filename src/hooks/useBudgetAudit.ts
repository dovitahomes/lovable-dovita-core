import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BudgetAuditRecord {
  id: string;
  budget_id: string;
  item_id: string | null;
  field: string;
  old_value: number | null;
  new_value: number | null;
  variation_percent: number | null;
  created_at: string;
}

export interface BudgetHistoryRecord {
  budget_id: string;
  project_id: string;
  type: string;
  version: number;
  status: string;
  created_at: string;
  client_id: string | null;
  total_items: number;
  budget_total: number;
  alerts_over_5: number;
}

/**
 * Hook para obtener el historial de auditoría de un presupuesto
 */
export function useBudgetAudit(budgetId?: string) {
  return useQuery({
    queryKey: ["budget-audit", budgetId],
    queryFn: async () => {
      if (!budgetId) return [];

      const { data, error } = await supabase
        .from("budget_audit" as any)
        .select("*")
        .eq("budget_id", budgetId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BudgetAuditRecord[];
    },
    enabled: !!budgetId,
  });
}

/**
 * Hook para obtener el historial completo de presupuestos de un proyecto
 */
export function useBudgetHistory(projectId?: string) {
  return useQuery({
    queryKey: ["budget-history", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("v_budget_history" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BudgetHistoryRecord[];
    },
    enabled: !!projectId,
  });
}

/**
 * Hook para comparar versiones y detectar variaciones > 5%
 */
export function useCompareBudgetVersions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      previousBudgetId,
      currentBudgetId,
    }: {
      previousBudgetId: string;
      currentBudgetId: string;
    }) => {
      // Obtener items de ambas versiones
      const { data: previousItems, error: prevError } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", previousBudgetId);

      const { data: currentItems, error: currError } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", currentBudgetId);

      if (prevError || currError) throw prevError || currError;

      const alerts: any[] = [];

      // Comparar items (por subpartida_id o descripción)
      for (const currItem of currentItems || []) {
        const prevItem = previousItems?.find(
          (p) =>
            p.subpartida_id === currItem.subpartida_id ||
            (p.descripcion === currItem.descripcion &&
              p.mayor_id === currItem.mayor_id)
        );

        if (prevItem && prevItem.costo_unit > 0) {
          const variation =
            ((currItem.costo_unit - prevItem.costo_unit) / prevItem.costo_unit) *
            100;

          if (Math.abs(variation) > 5) {
            alerts.push({
              budget_id: currentBudgetId,
              item_id: currItem.id,
              field: "costo_unit",
              old_value: prevItem.costo_unit,
              new_value: currItem.costo_unit,
              variation_percent: variation,
            });
          }
        }
      }

      // Guardar alertas en budget_audit
      if (alerts.length > 0) {
        const { error: insertError } = await supabase
          .from("budget_audit" as any)
          .insert(alerts);

        if (insertError) throw insertError;
      }

      return alerts;
    },
    onSuccess: (alerts) => {
      queryClient.invalidateQueries({ queryKey: ["budget-audit"] });
      queryClient.invalidateQueries({ queryKey: ["budget-history"] });

      if (alerts.length > 0) {
        toast.warning(
          `Se detectaron ${alerts.length} variación(es) > 5% en costos`,
          {
            description: "Revisa la pestaña de Alertas para más detalles",
          }
        );
      }
    },
    onError: (error: any) => {
      toast.error("Error al comparar versiones: " + error.message);
    },
  });
}

/**
 * Hook para crear nueva versión de presupuesto
 */
export function useCreateBudgetVersion() {
  const queryClient = useQueryClient();
  const compareMutation = useCompareBudgetVersions();

  return useMutation({
    mutationFn: async ({
      sourceBudgetId,
      incrementVersion = true,
    }: {
      sourceBudgetId: string;
      incrementVersion?: boolean;
    }) => {
      // Obtener presupuesto original
      const { data: sourceBudget, error: sourceError } = await supabase
        .from("budgets")
        .select("*, budget_items(*)")
        .eq("id", sourceBudgetId)
        .single();

      if (sourceError) throw sourceError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Crear nueva versión
      const { data: newBudget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          project_id: sourceBudget.project_id,
          type: sourceBudget.type,
          version: incrementVersion
            ? sourceBudget.version + 1
            : sourceBudget.version,
          iva_enabled: sourceBudget.iva_enabled,
          status: "borrador",
          notas: sourceBudget.notas,
          created_by: user.id,
          cliente_view_enabled: sourceBudget.cliente_view_enabled,
          shared_with_construction: sourceBudget.shared_with_construction,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Copiar items
      if (sourceBudget.budget_items && sourceBudget.budget_items.length > 0) {
        const { error: itemsError } = await supabase
          .from("budget_items")
          .insert(
            sourceBudget.budget_items.map((item: any) => ({
              budget_id: newBudget.id,
              mayor_id: item.mayor_id,
              partida_id: item.partida_id,
              subpartida_id: item.subpartida_id,
              descripcion: item.descripcion,
              unidad: item.unidad,
              cant_real: item.cant_real,
              cant_necesaria: item.cant_necesaria,
              desperdicio_pct: item.desperdicio_pct,
              costo_unit: item.costo_unit,
              precio_unit: item.precio_unit,
              honorarios_pct: item.honorarios_pct,
              proveedor_alias: item.proveedor_alias,
              order_index: item.order_index,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return { newBudget, sourceBudget };
    },
    onSuccess: async ({ newBudget, sourceBudget }) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget-history"] });

      // Comparar con versión anterior automáticamente
      if (sourceBudget) {
        await compareMutation.mutateAsync({
          previousBudgetId: sourceBudget.id,
          currentBudgetId: newBudget.id,
        });
      }

      toast.success(
        `Nueva versión v${newBudget.version} creada exitosamente`
      );
    },
    onError: (error: any) => {
      toast.error("Error al crear versión: " + error.message);
    },
  });
}

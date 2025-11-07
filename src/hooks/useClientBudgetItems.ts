import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useModuleAccess } from "./useModuleAccess";

export interface BudgetItem {
  id: string;
  budget_id: string;
  mayor_id: string | null;
  partida_id: string | null;
  subpartida_id: string | null;
  descripcion: string | null;
  unidad: string;
  cant_real: number;
  cant_necesaria: number | null;
  precio_unit: number | null;
  total: number | null;
  order_index: number;
  created_at: string;
  mayor_name?: string;
  partida_name?: string;
  subpartida_name?: string;
  // Columnas sensibles (solo para colaboradores/admin)
  desperdicio_pct?: number;
  costo_unit?: number;
  honorarios_pct?: number;
  proveedor_alias?: string | null;
  provider_id?: string | null;
}

interface UseClientBudgetItemsOptions {
  budgetId: string;
  enabled?: boolean;
}

/**
 * Hook que retorna items de presupuesto, filtrando columnas sensibles
 * si el usuario es cliente.
 * 
 * - Clientes: ven vista v_budget_items_client (sin costo, desperdicio, proveedor)
 * - Colaboradores/Admin: ven tabla budget_items completa
 */
export function useClientBudgetItems({ budgetId, enabled = true }: UseClientBudgetItemsOptions) {
  const { can } = useModuleAccess();
  const canEditBudgets = can("presupuestos", "edit");

  return useQuery({
    queryKey: ["budget-items", budgetId, canEditBudgets ? "full" : "client"],
    queryFn: async () => {
      if (canEditBudgets) {
        // Usuario con permisos de edición: ver datos completos
        const { data, error } = await supabase
          .from("budget_items")
          .select(`
            *,
            mayor:tu_nodes!budget_items_mayor_id_fkey(name),
            partida:tu_nodes!budget_items_partida_id_fkey(name),
            subpartida:tu_nodes!budget_items_subpartida_id_fkey(name)
          `)
          .eq("budget_id", budgetId)
          .order("order_index");

        if (error) throw error;

        return (data || []).map((item: any) => ({
          ...item,
          mayor_name: item.mayor?.name,
          partida_name: item.partida?.name,
          subpartida_name: item.subpartida?.name,
        })) as BudgetItem[];
      } else {
        // Cliente: usar vista filtrada (sin columnas sensibles)
        const { data, error } = await (supabase
          .from("v_budget_items_client" as any)
          .select("*")
          .eq("budget_id", budgetId)
          .order("order_index") as any);

        if (error) throw error;

        return (data || []) as BudgetItem[];
      }
    },
    enabled: enabled && !!budgetId,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectBudgetSummary {
  presupuesto: number;
  gastado: number;
  comprometido: number;
  disponible: number;
}

export interface MayorConsumption {
  mayorId: string;
  mayorCodigo: string;
  mayorNombre: string;
  presupuestado: number;
  gastado: number;
  comprometido: number;
  disponible: number;
  porcentajeConsumo: number;
  status: 'green' | 'yellow' | 'purple';
}

export interface ExpenseItem {
  id: string;
  date: Date;
  concept: string;
  amount: number;
  mayorNombre: string;
  type: 'gasto' | 'compromiso';
  provider?: string;
}

export function useProjectBudgetSummary(projectId: string | null) {
  return useQuery({
    queryKey: ['project-budget-summary', projectId],
    queryFn: async (): Promise<ProjectBudgetSummary> => {
      if (!projectId) {
        return { presupuesto: 0, gastado: 0, comprometido: 0, disponible: 0 };
      }

      // Get latest published budget for project
      const { data: budgets } = await supabase
        .from('budgets')
        .select('id, budget_items(total)')
        .eq('project_id', projectId)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false })
        .limit(1);

      const presupuesto = budgets?.[0]?.budget_items?.reduce(
        (sum, item: any) => sum + (item.total || 0), 
        0
      ) || 0;

      // Get actual expenses (transactions)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('project_id', projectId)
        .eq('type', 'egreso');

      const gastado = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Get committed expenses (purchase orders with budget items)
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select(`
          qty_ordenada,
          budget_items(precio_unit)
        `)
        .eq('project_id', projectId)
        .in('estado', ['solicitado', 'ordenado']);

      const comprometido = purchaseOrders?.reduce(
        (sum, po: any) => sum + ((po.budget_items?.precio_unit || 0) * (po.qty_ordenada || 0)), 
        0
      ) || 0;

      return {
        presupuesto,
        gastado,
        comprometido,
        disponible: presupuesto - gastado - comprometido,
      };
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!projectId,
  });
}

export function useMayorConsumption(projectId: string | null) {
  return useQuery({
    queryKey: ['mayor-consumption', projectId],
    queryFn: async (): Promise<MayorConsumption[]> => {
      if (!projectId) return [];

      // Get budget items grouped by mayor
      const { data: budgets } = await supabase
        .from('budgets')
        .select(`
          id,
          budget_items(
            mayor_id,
            total
          )
        `)
        .eq('project_id', projectId)
        .eq('status', 'publicado')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!budgets?.[0]?.budget_items) return [];

      // Group budget by mayor
      const mayorBudgetMap = new Map<string, number>();
      (budgets[0].budget_items as any[]).forEach((item: any) => {
        if (item.mayor_id) {
          mayorBudgetMap.set(
            item.mayor_id, 
            (mayorBudgetMap.get(item.mayor_id) || 0) + (item.total || 0)
          );
        }
      });

      // Get mayor details
      const mayorIds = Array.from(mayorBudgetMap.keys());
      const { data: mayores } = await supabase
        .from('tu_nodes')
        .select('id, code, name')
        .in('id', mayorIds);

      // Get transactions by mayor (through budget_items)
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          amount,
          budget_item_id,
          budget_items(mayor_id)
        `)
        .eq('project_id', projectId)
        .eq('type', 'egreso');

      const mayorGastosMap = new Map<string, number>();
      transactions?.forEach((t: any) => {
        const mayorId = t.budget_items?.mayor_id;
        if (mayorId) {
          mayorGastosMap.set(mayorId, (mayorGastosMap.get(mayorId) || 0) + (t.amount || 0));
        }
      });

      // Get purchase orders by mayor
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select(`
          qty_ordenada,
          budget_item_id,
          budget_items(mayor_id, precio_unit)
        `)
        .eq('project_id', projectId)
        .in('estado', ['solicitado', 'ordenado']);

      const mayorComprometidoMap = new Map<string, number>();
      purchaseOrders?.forEach((po: any) => {
        const mayorId = po.budget_items?.mayor_id;
        if (mayorId) {
          const total = (po.budget_items?.precio_unit || 0) * (po.qty_ordenada || 0);
          mayorComprometidoMap.set(mayorId, (mayorComprometidoMap.get(mayorId) || 0) + total);
        }
      });

      // Build result
      const result: MayorConsumption[] = [];
      mayorIds.forEach(mayorId => {
        const mayor = mayores?.find(m => m.id === mayorId);
        if (!mayor) return;

        const presupuestado = mayorBudgetMap.get(mayorId) || 0;
        const gastado = mayorGastosMap.get(mayorId) || 0;
        const comprometido = mayorComprometidoMap.get(mayorId) || 0;
        const disponible = presupuestado - gastado - comprometido;
        const porcentajeConsumo = presupuestado > 0 
          ? ((gastado + comprometido) / presupuestado) * 100 
          : 0;

        let status: 'green' | 'yellow' | 'purple' = 'green';
        if (porcentajeConsumo >= 95) status = 'purple';
        else if (porcentajeConsumo >= 80) status = 'yellow';

        result.push({
          mayorId,
          mayorCodigo: mayor.code,
          mayorNombre: mayor.name,
          presupuestado,
          gastado,
          comprometido,
          disponible,
          porcentajeConsumo,
          status,
        });
      });

      return result.sort((a, b) => b.porcentajeConsumo - a.porcentajeConsumo);
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!projectId,
  });
}

export function useProjectExpenseTimeline(projectId: string | null) {
  return useQuery({
    queryKey: ['project-expense-timeline', projectId],
    queryFn: async (): Promise<ExpenseItem[]> => {
      if (!projectId) return [];

      const result: ExpenseItem[] = [];

      // Get transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          concept,
          amount,
          budget_item_id,
          budget_items(
            mayor_id,
            tu_nodes(name)
          )
        `)
        .eq('project_id', projectId)
        .eq('type', 'egreso')
        .order('date', { ascending: false })
        .limit(50);

      transactions?.forEach((t: any) => {
        result.push({
          id: t.id,
          date: new Date(t.date),
          concept: t.concept || 'Sin concepto',
          amount: t.amount,
          mayorNombre: t.budget_items?.tu_nodes?.name || 'Sin categoría',
          type: 'gasto',
        });
      });

      // Get purchase orders
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          fecha_requerida,
          qty_ordenada,
          budget_item_id,
          proveedor_id,
          providers(name),
          budget_items(
            mayor_id,
            precio_unit,
            tu_nodes(name)
          )
        `)
        .eq('project_id', projectId)
        .in('estado', ['solicitado', 'ordenado'])
        .order('fecha_requerida', { ascending: false })
        .limit(50);

      purchaseOrders?.forEach((po: any) => {
        result.push({
          id: po.id,
          date: new Date(po.fecha_requerida),
          concept: 'Orden de Compra',
          amount: (po.budget_items?.precio_unit || 0) * (po.qty_ordenada || 0),
          mayorNombre: po.budget_items?.tu_nodes?.name || 'Sin categoría',
          type: 'compromiso',
          provider: po.providers?.name,
        });
      });

      // Sort by date descending
      return result.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30);
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!projectId,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_CONFIG } from '@/lib/queryConfig';

// Tipo que coincide con la vista v_budget_items_client
export interface BudgetItemClient {
  id: string;
  budget_id: string;
  mayor_id: string;
  mayor_name: string;
  partida_id: string;
  partida_name: string;
  subpartida_id: string | null;
  subpartida_name: string | null;
  descripcion: string;
  unidad: string;
  cant_necesaria: number;
  cant_real: number;
  pct_desperdicio: number | null;
  precio_unit: number;
  total: number;
  order_index: number;
  created_at: string;
}

export function useClientBudgetItems(projectId: string | null) {
  return useQuery<BudgetItemClient[]>({
    queryKey: ['client-budget-items', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // Romper la recursión de tipos usando fetch directo
      const { data, error }: { data: any; error: any } = await (supabase as any)
        .from('v_budget_items_client')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
    ...CACHE_CONFIG.active,
  });
}

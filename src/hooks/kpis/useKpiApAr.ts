import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useKpiApAr() {
  return useQuery({
    queryKey: ['kpi-ap-ar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('tipo, total_amount, paid');
      
      if (error) throw error;
      
      const total_cobrar = (data || [])
        .filter(inv => inv.tipo === 'ingreso' && !inv.paid)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      const total_pagar = (data || [])
        .filter(inv => inv.tipo === 'egreso' && !inv.paid)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      
      return { total_cobrar, total_pagar };
    },
    staleTime: 60000,
  });
}

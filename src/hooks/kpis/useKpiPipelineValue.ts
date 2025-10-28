import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useKpiPipelineValue() {
  return useQuery({
    queryKey: ['kpi-pipeline-value'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('presupuesto_referencia')
        .in('status', ['nuevo', 'contactado', 'calificado']);
      
      if (error) throw error;
      
      const total = (data || []).reduce((sum, item) => sum + (item.presupuesto_referencia || 0), 0);
      return total;
    },
    staleTime: 60000,
  });
}

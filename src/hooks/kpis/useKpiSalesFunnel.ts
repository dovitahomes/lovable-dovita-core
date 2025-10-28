import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SalesFunnelData {
  status: string;
  count: number;
}

export function useKpiSalesFunnel() {
  return useQuery({
    queryKey: ['kpi-sales-funnel'],
    queryFn: async () => {
      const { data: directData, error: directError } = await supabase
        .from('leads')
        .select('status');
      
      if (directError) throw directError;
      
      const grouped = (directData || []).reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(grouped).map(([status, count]) => ({ status, count }));
    },
    staleTime: 60000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlyFlow {
  month: string;
  monthLabel: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

export function useCashFlow(months: number = 6) {
  return useQuery({
    queryKey: ['cash-flow', months],
    queryFn: async (): Promise<MonthlyFlow[]> => {
      const result: MonthlyFlow[] = [];
      const today = new Date();

      // Get data for last N months
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate).toISOString();
        const monthEnd = endOfMonth(monthDate).toISOString();

        const { data: transactions, error } = await supabase
          .from('bank_transactions' as any)
          .select('type, amount')
          .gte('date', monthStart)
          .lte('date', monthEnd);

        if (error) throw error;

        const ingresos = (transactions as any[])
          ?.filter((t: any) => t.type === 'ingreso')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

        const egresos = (transactions as any[])
          ?.filter((t: any) => t.type === 'egreso')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

        result.push({
          month: format(monthDate, 'yyyy-MM'),
          monthLabel: format(monthDate, 'MMM yyyy', { locale: es }),
          ingresos,
          egresos,
          balance: ingresos - egresos,
        });
      }

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

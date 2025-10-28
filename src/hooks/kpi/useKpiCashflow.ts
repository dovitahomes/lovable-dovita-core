import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

export interface CashflowData {
  month: string;
  ingresos: number;
  egresos: number;
  neto: number;
}

export function useKpiCashflow(months: number = 6) {
  return useQuery({
    queryKey: ['kpi-cashflow', months],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subMonths(endDate, months);

      // Get all transactions in date range
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, { ingresos: number; egresos: number }>();

      // Initialize all months in range
      for (let i = 0; i < months; i++) {
        const monthDate = subMonths(endDate, months - 1 - i);
        const monthKey = format(startOfMonth(monthDate), 'yyyy-MM');
        monthlyData.set(monthKey, { ingresos: 0, egresos: 0 });
      }

      // Aggregate transactions
      transactions?.forEach(tx => {
        const monthKey = format(new Date(tx.date), 'yyyy-MM');
        const existing = monthlyData.get(monthKey);
        
        if (existing) {
          if (tx.type === 'ingreso') {
            existing.ingresos += Number(tx.amount);
          } else {
            existing.egresos += Number(tx.amount);
          }
        }
      });

      // Convert to array
      const result: CashflowData[] = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        ingresos: data.ingresos,
        egresos: data.egresos,
        neto: data.ingresos - data.egresos,
      }));

      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

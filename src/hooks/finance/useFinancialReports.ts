import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export interface IncomeVsExpenses {
  month: string;
  monthLabel: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface BalanceTrend {
  date: string;
  balance: number;
}

export interface DailyActivity {
  date: string;
  amount: number;
  transactionCount: number;
}

const CATEGORY_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function useIncomeVsExpenses(months: number = 6) {
  return useQuery({
    queryKey: ['financial-reports', 'income-vs-expenses', months],
    queryFn: async (): Promise<IncomeVsExpenses[]> => {
      const result: IncomeVsExpenses[] = [];
      const today = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate).toISOString();
        const monthEnd = endOfMonth(monthDate).toISOString();

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('type, amount')
          .gte('date', monthStart)
          .lte('date', monthEnd);

        if (error) throw error;

        const ingresos = transactions
          ?.filter(t => t.type === 'ingreso')
          .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        const egresos = transactions
          ?.filter(t => t.type === 'egreso')
          .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

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
    staleTime: 1000 * 60 * 5,
  });
}

export function useExpenseDistribution(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['financial-reports', 'expense-distribution', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async (): Promise<ExpenseByCategory[]> => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, concept')
        .eq('type', 'egreso')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by concept as category (since category column doesn't exist)
      const categoryMap = new Map<string, number>();
      transactions?.forEach(t => {
        const category = t.concept || 'Sin Categoría';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (t.amount || 0));
      });

      const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

      // Convert to array with percentages
      const result: ExpenseByCategory[] = Array.from(categoryMap.entries())
        .map(([category, amount], index) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Limit to top 10 categories

      return result;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useBalanceTrend(months: number = 6) {
  return useQuery({
    queryKey: ['financial-reports', 'balance-trend', months],
    queryFn: async (): Promise<BalanceTrend[]> => {
      const endDate = new Date();
      const startDate = subMonths(endDate, months);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, amount, type')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      // Get initial balance from bank accounts
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('saldo_actual')
        .eq('activa', true);

      let runningBalance = accounts?.reduce((sum, acc) => sum + (acc.saldo_actual || 0), 0) || 0;

      // Calculate daily balances
      const dailyBalances = new Map<string, number>();
      
      transactions?.forEach(t => {
        const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
        const amount = t.type === 'ingreso' ? t.amount : -t.amount;
        dailyBalances.set(dateKey, (dailyBalances.get(dateKey) || 0) + amount);
      });

      // Create result with running balance
      const result: BalanceTrend[] = [];
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dailyChange = dailyBalances.get(dateKey) || 0;
        runningBalance += dailyChange;
        
        result.push({
          date: dateKey,
          balance: runningBalance,
        });
      });

      return result;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialHeatmap(year: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: ['financial-reports', 'heatmap', year],
    queryFn: async (): Promise<DailyActivity[]> => {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by date
      const dailyMap = new Map<string, { amount: number; count: number }>();
      
      transactions?.forEach(t => {
        const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
        const existing = dailyMap.get(dateKey) || { amount: 0, count: 0 };
        dailyMap.set(dateKey, {
          amount: existing.amount + Math.abs(t.amount || 0),
          count: existing.count + 1,
        });
      });

      // Convert to array
      const result: DailyActivity[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        amount: data.amount,
        transactionCount: data.count,
      }));

      return result;
    },
    staleTime: 1000 * 60 * 10,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import { CACHE_CONFIG } from "@/lib/queryConfig";

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

// Optimized with pagination and memoization
export function useIncomeVsExpenses(months: number = 6) {
  return useQuery({
    queryKey: ['financial-reports', 'income-vs-expenses', months],
    queryFn: async (): Promise<IncomeVsExpenses[]> => {
      const today = new Date();
      const startDate = subMonths(today, months - 1);
      const startMonth = startOfMonth(startDate).toISOString();
      const endMonth = endOfMonth(today).toISOString();

      // Single query with date range instead of multiple queries
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .gte('date', startMonth)
        .lte('date', endMonth)
        .order('date', { ascending: true });

      if (error) throw error;

      // Memoized calculation - group by month
      const monthlyData = new Map<string, { ingresos: number; egresos: number }>();
      
      transactions?.forEach(t => {
        const monthKey = format(new Date(t.date), 'yyyy-MM');
        const existing = monthlyData.get(monthKey) || { ingresos: 0, egresos: 0 };
        
        if (t.type === 'ingreso') {
          existing.ingresos += t.amount || 0;
        } else if (t.type === 'egreso') {
          existing.egresos += t.amount || 0;
        }
        
        monthlyData.set(monthKey, existing);
      });

      // Build result array
      const result: IncomeVsExpenses[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const data = monthlyData.get(monthKey) || { ingresos: 0, egresos: 0 };

        result.push({
          month: monthKey,
          monthLabel: format(monthDate, 'MMM yyyy', { locale: es }),
          ingresos: data.ingresos,
          egresos: data.egresos,
          balance: data.ingresos - data.egresos,
        });
      }

      return result;
    },
    ...CACHE_CONFIG.readFrequent,
  });
}

// Optimized with limit and memoization
export function useExpenseDistribution(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['financial-reports', 'expense-distribution', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async (): Promise<ExpenseByCategory[]> => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, concept')
        .eq('type', 'egreso')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .limit(1000); // Pagination limit

      if (error) throw error;

      // Memoized grouping by concept
      const categoryMap = new Map<string, number>();
      transactions?.forEach(t => {
        const category = t.concept || 'Sin Categoría';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (t.amount || 0));
      });

      const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

      // Convert to array with percentages (top 10 only)
      const result: ExpenseByCategory[] = Array.from(categoryMap.entries())
        .map(([category, amount], index) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      return result;
    },
    ...CACHE_CONFIG.readFrequent,
  });
}

// Optimized with sampling for better performance
export function useBalanceTrend(months: number = 6) {
  return useQuery({
    queryKey: ['financial-reports', 'balance-trend', months],
    queryFn: async (): Promise<BalanceTrend[]> => {
      const endDate = new Date();
      const startDate = subMonths(endDate, months);

      // Fetch transactions with limit
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, amount, type')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .limit(5000); // Pagination limit

      if (error) throw error;

      // Get initial balance
      const { data: accounts } = await supabase
        .from('bank_accounts')
        .select('saldo_actual')
        .eq('activa', true);

      let runningBalance = accounts?.reduce((sum, acc) => sum + (acc.saldo_actual || 0), 0) || 0;

      // Calculate daily balances (memoized)
      const dailyBalances = new Map<string, number>();
      
      transactions?.forEach(t => {
        const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
        const amount = t.type === 'ingreso' ? t.amount : -t.amount;
        dailyBalances.set(dateKey, (dailyBalances.get(dateKey) || 0) + amount);
      });

      // Sample every 7 days for better performance
      const result: BalanceTrend[] = [];
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      days.forEach((day, index) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dailyChange = dailyBalances.get(dateKey) || 0;
        runningBalance += dailyChange;
        
        // Sample every 7 days or include last day
        if (index % 7 === 0 || index === days.length - 1) {
          result.push({
            date: dateKey,
            balance: runningBalance,
          });
        }
      });

      return result;
    },
    ...CACHE_CONFIG.readFrequent,
  });
}

// Optimized with memoization
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
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .limit(10000); // Pagination limit for full year

      if (error) throw error;

      // Memoized grouping by date
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
    ...CACHE_CONFIG.readFrequent,
  });
}

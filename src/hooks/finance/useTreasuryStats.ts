import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

interface TreasuryStats {
  totalBalance: number;
  monthIncome: number;
  monthExpenses: number;
  netFlow: number;
  activeAccounts: number;
}

export function useTreasuryStats() {
  return useQuery({
    queryKey: ['treasury-stats'],
    queryFn: async (): Promise<TreasuryStats> => {
      // Get all active bank accounts and their balances
      const { data: accounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('saldo_actual, activa')
        .eq('activa', true);

      if (accountsError) throw accountsError;

      const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.saldo_actual || 0), 0) || 0;
      const activeAccounts = accounts?.length || 0;

      // Get transactions for current month
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      const { data: transactions, error: transactionsError } = await supabase
        .from('bank_transactions' as any)
        .select('type, amount')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (transactionsError) throw transactionsError;

      const monthIncome = (transactions as any[])
        ?.filter((t: any) => t.type === 'ingreso')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      const monthExpenses = (transactions as any[])
        ?.filter((t: any) => t.type === 'egreso')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      const netFlow = monthIncome - monthExpenses;

      return {
        totalBalance,
        monthIncome,
        monthExpenses,
        netFlow,
        activeAccounts,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

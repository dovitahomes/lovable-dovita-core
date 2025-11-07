import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  date: string;
  description: string | null;
  amount: number;
  type: "ingreso" | "egreso";
  reference: string | null;
  reconciled: boolean;
  reconciled_with: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankReconciliation {
  transaction_id: string;
  bank_account_id: string;
  numero_cuenta: string | null;
  bank_name: string | null;
  date: string;
  description: string | null;
  amount: number;
  type: "ingreso" | "egreso";
  reference: string | null;
  reconciled: boolean;
  invoice_id: string | null;
  uuid_cfdi: string | null;
  invoice_total: number | null;
  emisor_id: string | null;
  supplier_name: string | null;
  diff: number | null;
  reconciled_exact: boolean | null;
}

/**
 * Hook para obtener movimientos bancarios
 */
export function useBankTransactions(bankAccountId?: string) {
  return useQuery({
    queryKey: ["bank-transactions", bankAccountId],
    queryFn: async () => {
      let query = supabase
        .from("bank_transactions" as any)
        .select("*")
        .order("date", { ascending: false });

      if (bankAccountId) {
        query = query.eq("bank_account_id", bankAccountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as BankTransaction[];
    },
  });
}

/**
 * Hook para obtener vista de conciliación bancaria
 */
export function useBankReconciliation(filters?: {
  startDate?: string;
  endDate?: string;
  reconciled?: boolean;
}) {
  return useQuery({
    queryKey: ["bank-reconciliation", filters],
    queryFn: async () => {
      let query = supabase.from("v_bank_reconciliation" as any).select("*");

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters?.reconciled !== undefined) {
        query = query.eq("reconciled", filters.reconciled);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as BankReconciliation[];
    },
  });
}

/**
 * Hook para registrar movimiento bancario
 */
export function useCreateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<BankTransaction, "id" | "created_at" | "updated_at" | "reconciled" | "reconciled_with">) => {
      const { error } = await supabase
        .from("bank_transactions" as any)
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliation"] });
      toast.success("Movimiento bancario registrado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

/**
 * Hook para conciliar movimiento con factura
 */
export function useReconcileBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      invoiceId,
    }: {
      transactionId: string;
      invoiceId: string;
    }) => {
      const { error } = await supabase
        .from("bank_transactions" as any)
        .update({
          reconciled: true,
          reconciled_with: invoiceId,
        })
        .eq("id", transactionId);

      if (error) throw error;

      // Marcar factura como pagada
      await supabase
        .from("invoices")
        .update({ paid: true })
        .eq("id", invoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Movimiento conciliado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al conciliar: " + error.message);
    },
  });
}

/**
 * Hook para desconciliar movimiento
 */
export function useUnreconcileBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      // Obtener el movimiento para saber qué factura desconciliar
      const { data: transaction, error: fetchError } = await supabase
        .from("bank_transactions" as any)
        .select("reconciled_with")
        .eq("id", transactionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("bank_transactions" as any)
        .update({
          reconciled: false,
          reconciled_with: null,
        })
        .eq("id", transactionId);

      if (error) throw error;

      // Marcar factura como pendiente
      if (transaction && (transaction as any).reconciled_with) {
        await supabase
          .from("invoices")
          .update({ paid: false })
          .eq("id", (transaction as any).reconciled_with);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Conciliación deshecha");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

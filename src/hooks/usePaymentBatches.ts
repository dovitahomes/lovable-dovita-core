import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentBatchItem {
  id: string;
  batch_id: string;
  invoice_id: string;
  amount: number;
  created_at: string;
}

export interface PaymentBatchSummary {
  batch_id: string;
  title: string | null;
  status: string;
  scheduled_date: string | null;
  bank_account_id: string | null;
  numero_cuenta: string | null;
  bank_name: string | null;
  invoice_count: number;
  total_amount: number;
  created_at: string;
}

/**
 * Hook para obtener resumen de lotes de pago
 */
export function usePaymentBatches() {
  return useQuery({
    queryKey: ["payment-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_payment_batch_summary" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as PaymentBatchSummary[];
    },
  });
}

/**
 * Hook para obtener items de un lote de pago
 */
export function usePaymentBatchItems(batchId?: string) {
  return useQuery({
    queryKey: ["payment-batch-items", batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from("payment_batch_items" as any)
        .select(`
          *,
          invoices (
            uuid,
            total_amount,
            emisor_id,
            providers:emisor_id (name)
          )
        `)
        .eq("batch_id", batchId);

      if (error) throw error;
      return (data || []) as unknown as (PaymentBatchItem & { invoices?: any })[];
    },
    enabled: !!batchId,
  });
}

/**
 * Hook para crear lote de pago
 */
export function useCreatePaymentBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title?: string;
      bank_account_id?: string;
      scheduled_date?: string;
    }) => {
      const { data: batch, error } = await supabase
        .from("pay_batches")
        .insert({
          ...data,
          status: "borrador",
        })
        .select()
        .single();

      if (error) throw error;
      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      toast.success("Lote de pago creado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

/**
 * Hook para agregar factura a lote
 */
export function useAddInvoiceToPaymentBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      invoiceId,
      amount,
    }: {
      batchId: string;
      invoiceId: string;
      amount: number;
    }) => {
      const { error } = await supabase
        .from("payment_batch_items" as any)
        .insert({
          batch_id: batchId,
          invoice_id: invoiceId,
          amount,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-batch-items"] });
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      toast.success("Factura agregada al lote");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

/**
 * Hook para remover factura de lote
 */
export function useRemoveInvoiceFromPaymentBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("payment_batch_items" as any)
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-batch-items"] });
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      toast.success("Factura removida del lote");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

/**
 * Hook para marcar lote como pagado
 */
export function useMarkPaymentBatchAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (batchId: string) => {
      // Actualizar estado del lote
      const { error: batchError } = await supabase
        .from("pay_batches")
        .update({ status: "pagado" })
        .eq("id", batchId);

      if (batchError) throw batchError;

      // Obtener facturas del lote y marcarlas como pagadas
      const { data: items } = await supabase
        .from("payment_batch_items" as any)
        .select("invoice_id")
        .eq("batch_id", batchId);

      if (items && items.length > 0) {
        const invoiceIds = items.map((item: any) => item.invoice_id);
        await supabase
          .from("invoices")
          .update({ paid: true })
          .in("id", invoiceIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-batches"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Lote marcado como pagado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

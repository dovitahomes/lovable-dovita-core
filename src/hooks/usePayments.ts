import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CACHE_CONFIG } from "@/lib/queryConfig";

// Hook para listar batches de pagos
export function usePayBatches(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["pay_batches", params],
    queryFn: async () => {
      let query = supabase
        .from("pay_batches")
        .select(`
          *,
          bank_accounts(id, numero_cuenta, bank_id)
        `)
        .order("created_at", { ascending: false });

      if (params?.status) {
        query = query.eq("status", params.status);
      }
      if (params?.search) {
        query = query.ilike("title", `%${params.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIG.active,
  });
}

// Hook para un batch específico
export function usePayBatch(batchId?: string) {
  return useQuery({
    queryKey: ["pay_batch", batchId],
    queryFn: async () => {
      if (!batchId) return null;

      const { data, error } = await supabase
        .from("pay_batches")
        .select(`
          *,
          bank_accounts(id, numero_cuenta, bank_id)
        `)
        .eq("id", batchId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
    ...CACHE_CONFIG.active,
  });
}

// Hook para los pagos de un batch
export function usePaymentsOfBatch(batchId?: string) {
  return useQuery({
    queryKey: ["payments_of_batch", batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          providers(id, name, code_short),
          purchase_orders(id, folio, project_id, projects(notas))
        `)
        .eq("pay_batch_id", batchId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
    ...CACHE_CONFIG.active,
  });
}

// Hook para crear/actualizar batch
export function useUpsertPayBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;

      if (id) {
        const { data: result, error } = await supabase
          .from("pay_batches")
          .update(rest)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from("pay_batches")
          .insert(rest)
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay_batches"] });
      queryClient.invalidateQueries({ queryKey: ["pay_batch"] });
      toast({ title: "Batch guardado correctamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al guardar batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para agregar pagos a un batch
export function useAddPaymentsToBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payments: any[]) => {
      const { data, error } = await supabase.from("payments").insert(payments).select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_of_batch"] });
      toast({ title: "Pagos agregados correctamente" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al agregar pagos",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para actualizar un pago
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: result, error } = await supabase
        .from("payments")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_of_batch"] });
      toast({ title: "Pago actualizado" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para marcar pago como pagado
export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reference }: { id: string; reference?: string }) => {
      const { data, error } = await supabase
        .from("payments")
        .update({
          status: "pagado",
          transfer_date: new Date().toISOString(),
          reference: reference || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_of_batch"] });
      toast({ title: "Pago marcado como pagado" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al marcar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para eliminar pago
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments_of_batch"] });
      toast({ title: "Pago eliminado" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para eliminar batch
export function useDeletePayBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pay_batches").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay_batches"] });
      toast({ title: "Batch eliminado" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook para obtener OCs pendientes de pago (versión simplificada)
export function usePurchaseOrdersForPayment(params?: {
  dateRange?: { from?: Date; to?: Date };
  projectIds?: string[];
  providerIds?: string[];
}) {
  // Retornar hook vacío temporalmente hasta que los tipos de Supabase se actualicen
  return useQuery({
    queryKey: ["purchase_orders_for_payment", params],
    queryFn: async () => {
      return [];
    },
    ...CACHE_CONFIG.active,
  });
}

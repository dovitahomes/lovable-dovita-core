import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CACHE_CONFIG } from "@/lib/queryConfig";

// NOTE: pay_batches table exists in types but may not be fully implemented in DB
// This hook is disabled until the full payments infrastructure is ready
export function usePayBatches(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["pay_batches", params],
    queryFn: async () => {
      // Disabled: tables may not exist yet
      return [];
    },
    enabled: false,
    ...CACHE_CONFIG.active,
  });
}

// Hook para un batch específico (disabled)
export function usePayBatch(batchId?: string) {
  return useQuery({
    queryKey: ["pay_batch", batchId],
    queryFn: async () => null,
    enabled: false,
    ...CACHE_CONFIG.active,
  });
}

// Hook para los pagos de un batch (disabled)
export function usePaymentsOfBatch(batchId?: string) {
  return useQuery({
    queryKey: ["payments_of_batch", batchId],
    queryFn: async () => [],
    enabled: false,
    ...CACHE_CONFIG.active,
  });
}

// Hook para crear/actualizar batch (disabled)
export function useUpsertPayBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      throw new Error("Payment batches not implemented yet");
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

// Hook para agregar pagos a un batch (disabled)
export function useAddPaymentsToBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payments: any[]) => {
      throw new Error("Payments not implemented yet");
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

// Hook para actualizar un pago (disabled)
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      throw new Error("Payments not implemented yet");
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

// Hook para marcar pago como pagado (disabled)
export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reference }: { id: string; reference?: string }) => {
      throw new Error("Payments not implemented yet");
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

// Hook para eliminar pago (disabled)
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      throw new Error("Payments not implemented yet");
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

// Hook para eliminar batch (disabled)
export function useDeletePayBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      throw new Error("Payment batches not implemented yet");
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

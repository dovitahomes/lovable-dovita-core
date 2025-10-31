import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProviderUsage {
  purchaseOrders: {
    id: string;
    project_id: string;
    project_name: string;
    subpartida_name: string;
    estado: string;
    qty_solicitada: number;
    fecha_requerida: string | null;
    created_at: string;
  }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    transfer_date: string | null;
    reference: string | null;
  }[];
}

export function useProviderUsage(providerId?: string) {
  return useQuery({
    queryKey: ["provider-usage", providerId],
    queryFn: async () => {
      if (!providerId) return null;

      // Get purchase orders from the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: purchaseOrders, error: poError } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          project_id,
          estado,
          qty_solicitada,
          fecha_requerida,
          created_at,
          projects!inner(id, client_id, clients(name)),
          tu_nodes!purchase_orders_subpartida_id_fkey(name)
        `)
        .eq("proveedor_id", providerId)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (poError) throw poError;

      const { data: payments, error: payError } = await supabase
        .from("payments")
        .select("id, amount, status, transfer_date, reference")
        .eq("proveedor_id", providerId)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (payError) throw payError;

      return {
        purchaseOrders: (purchaseOrders || []).map((po: any) => ({
          id: po.id,
          project_id: po.project_id,
          project_name: po.projects?.clients?.name || "Sin proyecto",
          subpartida_name: po.tu_nodes?.name || "Sin especificar",
          estado: po.estado,
          qty_solicitada: po.qty_solicitada,
          fecha_requerida: po.fecha_requerida,
          created_at: po.created_at,
        })),
        payments: payments || [],
      } as ProviderUsage;
    },
    enabled: !!providerId,
  });
}

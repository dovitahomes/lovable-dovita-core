import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProviderBalance {
  providerId: string;
  providerName: string;
  providerCode: string;
  totalPendiente: number;
  facturasPendientes: number;
  proximoPago: Date | null;
  diasVencimiento: number | null;
  status: 'al_dia' | 'por_vencer' | 'vencido';
}

export function useProviderBalances() {
  return useQuery({
    queryKey: ['provider-balances'],
    queryFn: async (): Promise<ProviderBalance[]> => {
      // Get all invoices with provider info
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          paid,
          fecha_emision,
          fecha_vencimiento,
          provider_id,
          providers(id, name, code_short)
        `)
        .eq('tipo', 'egreso')
        .eq('paid', false);

      if (error) throw error;

      // Group by provider
      const providerMap = new Map<string, {
        name: string;
        code: string;
        totalPendiente: number;
        facturasPendientes: number;
        proximoPago: Date | null;
        diasVencimiento: number | null;
      }>();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      invoices?.forEach((inv: any) => {
        if (!inv.provider_id || !inv.providers) return;

        const providerId = inv.provider_id;
        const existing = providerMap.get(providerId);
        
        const fechaVencimiento = inv.fecha_vencimiento ? new Date(inv.fecha_vencimiento) : null;
        let diasVencimiento: number | null = null;
        
        if (fechaVencimiento) {
          const diffTime = fechaVencimiento.getTime() - today.getTime();
          diasVencimiento = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        if (existing) {
          existing.totalPendiente += inv.total_amount || 0;
          existing.facturasPendientes += 1;
          
          // Update proxima pago if this one is sooner
          if (fechaVencimiento) {
            if (!existing.proximoPago || fechaVencimiento < existing.proximoPago) {
              existing.proximoPago = fechaVencimiento;
              existing.diasVencimiento = diasVencimiento;
            }
          }
        } else {
          providerMap.set(providerId, {
            name: inv.providers.name,
            code: inv.providers.code_short || 'N/A',
            totalPendiente: inv.total_amount || 0,
            facturasPendientes: 1,
            proximoPago: fechaVencimiento,
            diasVencimiento,
          });
        }
      });

      // Convert to array with status
      const result: ProviderBalance[] = Array.from(providerMap.entries()).map(([providerId, data]) => {
        let status: 'al_dia' | 'por_vencer' | 'vencido' = 'al_dia';
        
        if (data.diasVencimiento !== null) {
          if (data.diasVencimiento < 0) {
            status = 'vencido';
          } else if (data.diasVencimiento <= 7) {
            status = 'por_vencer';
          }
        }

        return {
          providerId,
          providerName: data.name,
          providerCode: data.code,
          totalPendiente: data.totalPendiente,
          facturasPendientes: data.facturasPendientes,
          proximoPago: data.proximoPago,
          diasVencimiento: data.diasVencimiento,
          status,
        };
      });

      // Sort by status priority (vencido > por_vencer > al_dia) and then by amount
      return result.sort((a, b) => {
        const statusOrder = { vencido: 0, por_vencer: 1, al_dia: 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return b.totalPendiente - a.totalPendiente;
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

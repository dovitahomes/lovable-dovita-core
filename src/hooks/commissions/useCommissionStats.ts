import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, addDays } from "date-fns";

interface CommissionStats {
  totalPendiente: number;
  totalPagadoMes: number;
  proximasVencer: number;
  totalGenerado: number;
}

export function useCommissionStats() {
  return useQuery({
    queryKey: ['commission-stats'],
    queryFn: async (): Promise<CommissionStats> => {
      // Get all commissions
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select('status, calculated_amount, paid_at, created_at');

      if (error) throw error;

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      const next7Days = addDays(now, 7).toISOString();

      // Total Pendiente (calculada o pendiente)
      const totalPendiente = (commissions || [])
        .filter(c => c.status === 'calculada' || c.status === 'pendiente')
        .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

      // Pagado Este Mes
      const totalPagadoMes = (commissions || [])
        .filter(c => c.status === 'pagada' && c.paid_at && c.paid_at >= monthStart && c.paid_at <= monthEnd)
        .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

      // Próximas a Vencer (pendientes creadas hace más de 23 días - asumiendo 30 días para pago)
      const proximasVencer = (commissions || [])
        .filter(c => {
          if (c.status !== 'pendiente' && c.status !== 'calculada') return false;
          const daysOld = (now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return daysOld >= 23; // Próximas a vencer en 7 días
        })
        .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

      // Total Generado (todas las comisiones)
      const totalGenerado = (commissions || [])
        .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

      return {
        totalPendiente,
        totalPagadoMes,
        proximasVencer,
        totalGenerado,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

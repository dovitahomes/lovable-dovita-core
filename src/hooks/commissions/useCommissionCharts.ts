import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlyData {
  month: string;
  generadas: number;
  pagadas: number;
}

interface DistributionData {
  tipo: string;
  total: number;
}

interface TopAlliance {
  nombre: string;
  total: number;
}

export function useCommissionGeneratedVsPaid(months: number = 6) {
  return useQuery({
    queryKey: ['commission-generated-vs-paid', months],
    queryFn: async (): Promise<MonthlyData[]> => {
      const startDate = startOfMonth(subMonths(new Date(), months - 1));
      
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select('created_at, paid_at, status, calculated_amount')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const monthlyMap = new Map<string, { generadas: number; pagadas: number }>();

      // Initialize months
      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(startOfMonth(date), 'yyyy-MM');
        const label = format(startOfMonth(date), 'MMM yyyy', { locale: es });
        monthlyMap.set(key, { generadas: 0, pagadas: 0 });
      }

      // Process commissions
      (commissions || []).forEach(commission => {
        const createdKey = format(new Date(commission.created_at), 'yyyy-MM');
        if (monthlyMap.has(createdKey)) {
          const current = monthlyMap.get(createdKey)!;
          current.generadas += commission.calculated_amount || 0;
        }

        if (commission.status === 'pagada' && commission.paid_at) {
          const paidKey = format(new Date(commission.paid_at), 'yyyy-MM');
          if (monthlyMap.has(paidKey)) {
            const current = monthlyMap.get(paidKey)!;
            current.pagadas += commission.calculated_amount || 0;
          }
        }
      });

      return Array.from(monthlyMap.entries()).map(([key, data]) => ({
        month: format(new Date(key + '-01'), 'MMM yyyy', { locale: es }),
        generadas: data.generadas,
        pagadas: data.pagadas,
      }));
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCommissionDistribution() {
  return useQuery({
    queryKey: ['commission-distribution'],
    queryFn: async (): Promise<DistributionData[]> => {
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select('tipo, calculated_amount');

      if (error) throw error;

      const alianzas = (commissions || [])
        .filter(c => c.tipo === 'alianza')
        .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

      const colaboradores = (commissions || [])
        .filter(c => c.tipo === 'colaborador')
        .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

      return [
        { tipo: 'Alianzas', total: alianzas },
        { tipo: 'Colaboradores', total: colaboradores },
      ];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useTopAlliances(limit: number = 5) {
  return useQuery({
    queryKey: ['top-alliances', limit],
    queryFn: async (): Promise<TopAlliance[]> => {
      // Get commissions with alliance names
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select(`
          calculated_amount,
          sujeto_id,
          alianzas:sujeto_id (nombre)
        `)
        .eq('tipo', 'alianza');

      if (error) throw error;

      // Aggregate by alliance
      const allianceMap = new Map<string, number>();
      
      (commissions || []).forEach((commission: any) => {
        const nombre = commission.alianzas?.nombre || 'Sin nombre';
        const current = allianceMap.get(nombre) || 0;
        allianceMap.set(nombre, current + (commission.calculated_amount || 0));
      });

      // Convert to array and sort
      return Array.from(allianceMap.entries())
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 2,
  });
}

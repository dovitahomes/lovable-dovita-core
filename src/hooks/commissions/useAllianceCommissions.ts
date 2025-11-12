import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AllianceWithCommissions {
  id: string;
  nombre: string;
  tipo: string;
  comision_porcentaje: number;
  activa: boolean;
  totalGenerado: number;
  totalPendiente: number;
  totalPagado: number;
  numeroComisiones: number;
}

interface CommissionFilters {
  status?: 'calculada' | 'pendiente' | 'pagada' | 'all';
  startDate?: string;
  endDate?: string;
  alianzaId?: string;
}

export function useAlliancesWithCommissions() {
  return useQuery({
    queryKey: ['alliances-with-commissions'],
    queryFn: async (): Promise<AllianceWithCommissions[]> => {
      // Get all alliances
      const { data: alianzas, error: alianzasError } = await supabase
        .from('alianzas')
        .select('*')
        .order('nombre');

      if (alianzasError) throw alianzasError;

      // Get all alliance commissions
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('sujeto_id, status, calculated_amount')
        .eq('tipo', 'alianza');

      if (commissionsError) throw commissionsError;

      // Aggregate by alliance
      return (alianzas || []).map(alianza => {
        const allianceCommissions = (commissions || []).filter(
          c => c.sujeto_id === alianza.id
        );

        const totalGenerado = allianceCommissions.reduce(
          (sum, c) => sum + (c.calculated_amount || 0), 0
        );
        
        const totalPendiente = allianceCommissions
          .filter(c => c.status === 'calculada' || c.status === 'pendiente')
          .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

        const totalPagado = allianceCommissions
          .filter(c => c.status === 'pagada')
          .reduce((sum, c) => sum + (c.calculated_amount || 0), 0);

        return {
          id: alianza.id,
          nombre: alianza.nombre,
          tipo: alianza.tipo,
          comision_porcentaje: alianza.comision_porcentaje,
          activa: alianza.activa,
          totalGenerado,
          totalPendiente,
          totalPagado,
          numeroComisiones: allianceCommissions.length,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useAllianceCommissions(filters?: CommissionFilters) {
  return useQuery({
    queryKey: ['alliance-commissions', filters],
    queryFn: async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          alianzas:sujeto_id (nombre, tipo, comision_porcentaje),
          budgets:deal_ref (id, project_id, projects(client_id, clients(name)))
        `)
        .eq('tipo', 'alianza')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.alianzaId) {
        query = query.eq('sujeto_id', filters.alianzaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60,
  });
}

export function useMarkCommissionAsPaid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commissionId: string) => {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'pagada',
          paid_at: new Date().toISOString(),
        })
        .eq('id', commissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alliance-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['alliances-with-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      toast({
        title: 'Éxito',
        description: 'Comisión marcada como pagada',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBulkMarkAsPaid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'pagada',
          paid_at: new Date().toISOString(),
        })
        .in('id', commissionIds);

      if (error) throw error;
    },
    onSuccess: (_, commissionIds) => {
      queryClient.invalidateQueries({ queryKey: ['alliance-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['alliances-with-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-stats'] });
      toast({
        title: 'Éxito',
        description: `${commissionIds.length} comisiones marcadas como pagadas`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

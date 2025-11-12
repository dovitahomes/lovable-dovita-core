import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TUStats {
  total: { count: number; nodeIds: string[] };
  departamentos: { count: number; nodeIds: string[] };
  mayores: { count: number; nodeIds: string[] };
  partidas: { count: number; nodeIds: string[] };
  subpartidas: { count: number; nodeIds: string[] };
}

export function useTUStats(scopeFilter: 'global' | 'sucursal' | 'proyecto') {
  return useQuery({
    queryKey: ['tu-stats', scopeFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('id, type')
        .eq('project_scope', scopeFilter);

      if (error) throw error;

      const nodes = data || [];
      
      const stats: TUStats = {
        total: {
          count: nodes.length,
          nodeIds: nodes.map(n => n.id)
        },
        departamentos: {
          count: nodes.filter(n => n.type === 'departamento').length,
          nodeIds: nodes.filter(n => n.type === 'departamento').map(n => n.id)
        },
        mayores: {
          count: nodes.filter(n => n.type === 'mayor').length,
          nodeIds: nodes.filter(n => n.type === 'mayor').map(n => n.id)
        },
        partidas: {
          count: nodes.filter(n => n.type === 'partida').length,
          nodeIds: nodes.filter(n => n.type === 'partida').map(n => n.id)
        },
        subpartidas: {
          count: nodes.filter(n => n.type === 'subpartida').length,
          nodeIds: nodes.filter(n => n.type === 'subpartida').map(n => n.id)
        }
      };

      return stats;
    },
    staleTime: 30000, // 30 seconds
  });
}

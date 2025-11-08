import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export type OpportunityStage = 'prospecto' | 'calificado' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido';

export interface Opportunity {
  id: string;
  folio: string;
  name: string;
  account_id: string;
  contact_id?: string;
  stage: OpportunityStage;
  amount?: number;
  probability?: number;
  expected_close_date?: string;
  closed_date?: string;
  notes?: string;
  loss_reason?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  accounts?: { name: string };
  contacts?: { first_name: string; last_name: string };
}

export interface OpportunityWithUnits extends Opportunity {
  units_count?: number;
}

export function useOpportunities(search: string = "", stage?: OpportunityStage) {
  return useQuery({
    queryKey: ['opportunities', search, stage],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          accounts(name),
          contacts(first_name, last_name)
        `)
        .order('updated_at', { ascending: false });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,folio.ilike.%${search}%`);
      }
      
      if (stage) {
        query = query.eq('stage', stage);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Get units count for each opportunity
      const opportunities = data as Opportunity[];
      const opportunitiesWithUnits: OpportunityWithUnits[] = await Promise.all(
        opportunities.map(async (opp) => {
          const { count } = await supabase
            .from('opportunity_units')
            .select('*', { count: 'exact', head: true })
            .eq('opportunity_id', opp.id);
          
          return {
            ...opp,
            units_count: count || 0
          };
        })
      );
      
      return opportunitiesWithUnits;
    },
    ...CACHE_CONFIG.active,
  });
}

export function useOpportunityById(id: string | null) {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          accounts(name),
          contacts(first_name, last_name)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Opportunity;
    },
    enabled: !!id,
  });
}

export function useOpportunityUnits(opportunityId: string | null) {
  return useQuery({
    queryKey: ['opportunity-units', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return [];
      const { data, error } = await supabase
        .from('opportunity_units')
        .select(`
          *,
          units(*)
        `)
        .eq('opportunity_id', opportunityId);
      if (error) throw error;
      return data;
    },
    enabled: !!opportunityId,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Opportunity>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: opportunity, error } = await supabase
        .from('opportunities')
        .insert({
          ...data,
          created_by: userId
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return opportunity;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success("Oportunidad creada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al crear oportunidad: " + error.message);
    }
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Opportunity> }) => {
      const { error } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success("Oportunidad actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar oportunidad: " + error.message);
    }
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success("Oportunidad eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar oportunidad: " + error.message);
    }
  });
}

export function useLinkOpportunityUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ opportunityId, unitId }: { opportunityId: string; unitId: string }) => {
      const { error } = await supabase
        .from('opportunity_units')
        .insert({ opportunity_id: opportunityId, unit_id: unitId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-units'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success("Unidad vinculada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al vincular unidad: " + error.message);
    }
  });
}

export function useUnlinkOpportunityUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunity_units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-units'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success("Unidad desvinculada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al desvincular unidad: " + error.message);
    }
  });
}

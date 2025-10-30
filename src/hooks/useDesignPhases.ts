import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DesignPhase {
  id: string;
  project_id: string;
  phase_key: string;
  phase_name: string;
  order_index: number;
  status: 'pendiente' | 'en_proceso' | 'terminada';
  start_at?: string;
  end_at?: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PHASES = [
  { phase_key: 'visita_reglamento', phase_name: 'Visita de sitio y Reglamento', order_index: 0 },
  { phase_key: 'zonificacion', phase_name: 'Zonificación / Planta Arquitectónica', order_index: 1 },
  { phase_key: 'volumetria', phase_name: 'Volumetría', order_index: 2 },
  { phase_key: 'acabados', phase_name: 'Acabados', order_index: 3 },
  { phase_key: 'renders', phase_name: 'Renders', order_index: 4 },
  { phase_key: 'visto_bueno', phase_name: 'Visto Bueno', order_index: 5 },
];

export function useDesignPhases(projectId: string) {
  return useQuery({
    queryKey: ['design-phases', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as DesignPhase[];
    },
    enabled: !!projectId,
  });
}

export function useSeedDefaultPhases() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const phases = DEFAULT_PHASES.map(p => ({
        ...p,
        project_id: projectId,
        status: 'pendiente' as const,
      }));
      
      const { data, error } = await supabase
        .from('design_phases')
        .insert(phases)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['design-phases', projectId] });
      toast({ description: "Fases creadas exitosamente" });
    },
    onError: (error) => {
      console.error('Error seeding phases:', error);
      toast({ 
        variant: "destructive",
        description: "Error al crear fases por defecto" 
      });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DesignPhase> }) => {
      const { data, error } = await supabase
        .from('design_phases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-phases', data.project_id] });
      toast({ description: "Fase actualizada" });
    },
    onError: (error) => {
      console.error('Error updating phase:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar fase" 
      });
    },
  });
}

export function useStartPhase() {
  const updatePhase = useUpdatePhase();
  
  return useMutation({
    mutationFn: async (phaseId: string) => {
      return updatePhase.mutateAsync({
        id: phaseId,
        updates: {
          status: 'en_proceso',
          start_at: new Date().toISOString(),
        },
      });
    },
  });
}

export function useFinishPhase() {
  const updatePhase = useUpdatePhase();
  
  return useMutation({
    mutationFn: async (phaseId: string) => {
      return updatePhase.mutateAsync({
        id: phaseId,
        updates: {
          status: 'terminada',
          end_at: new Date().toISOString(),
        },
      });
    },
  });
}

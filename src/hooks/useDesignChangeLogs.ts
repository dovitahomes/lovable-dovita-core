import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DesignChangeLog {
  id: string;
  project_id: string;
  phase_id?: string;
  meeting_date: string;
  requested_by?: string;
  changes_json: { area: string; detalle: string }[];
  signed: boolean;
  signature_url?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface ChangeLogFilters {
  requested_by?: string;
  phase_id?: string;
}

export function useDesignChangeLogs(projectId: string, filters?: ChangeLogFilters) {
  return useQuery({
    queryKey: ['design-change-logs', projectId, filters],
    queryFn: async () => {
      let query = supabase
        .from('design_change_logs')
        .select('*, design_phases(phase_name)')
        .eq('project_id', projectId)
        .order('meeting_date', { ascending: false });
      
      if (filters?.requested_by) {
        query = query.ilike('requested_by', `%${filters.requested_by}%`);
      }
      
      if (filters?.phase_id) {
        query = query.eq('phase_id', filters.phase_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateChangeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: Omit<DesignChangeLog, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('design_change_logs')
        .insert({
          ...log,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-change-logs', data.project_id] });
      toast({ description: "Entrada agregada a la bitácora" });
    },
    onError: (error) => {
      console.error('Error creating change log:', error);
      toast({ 
        variant: "destructive",
        description: "Error al crear entrada" 
      });
    },
  });
}

export function useUpdateChangeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DesignChangeLog> }) => {
      const { data, error } = await supabase
        .from('design_change_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-change-logs', data.project_id] });
      toast({ description: "Entrada actualizada" });
    },
    onError: (error) => {
      console.error('Error updating change log:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar entrada" 
      });
    },
  });
}

export function useDeleteChangeLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('design_change_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-change-logs', data.projectId] });
      toast({ description: "Entrada eliminada" });
    },
    onError: (error) => {
      console.error('Error deleting change log:', error);
      toast({ 
        variant: "destructive",
        description: "Error al eliminar entrada" 
      });
    },
  });
}

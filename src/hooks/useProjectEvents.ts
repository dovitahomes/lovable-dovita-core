import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ProjectEvent {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: 'propuesta' | 'aceptada' | 'rechazada' | 'cancelada';
  created_at: string;
  created_by_name?: string;
}

export function useProjectEvents(projectId: string) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['project-events', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      // Fetch creator names separately
      const creatorIds = [...new Set(data?.map(e => e.created_by).filter(Boolean))];
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', creatorIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]));
        
        return data.map(event => ({
          ...event,
          created_by_name: event.created_by ? profileMap.get(event.created_by) : undefined,
        })) as ProjectEvent[];
      }
      
      return data as ProjectEvent[];
    },
    enabled: !!projectId,
  });
  
  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;
    
    const channel = supabase
      .channel(`project-events:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_events',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [projectId, queryClient]);
  
  return query;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<ProjectEvent, 'id' | 'created_at' | 'created_by_name'>) => {
      const { error } = await supabase
        .from('project_events')
        .insert(event);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', variables.project_id] });
      toast.success("Evento creado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, projectId }: { id: string; status: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_events')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', data.projectId] });
      toast.success("Estado actualizado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', data.projectId] });
      toast.success("Evento eliminado");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });
}

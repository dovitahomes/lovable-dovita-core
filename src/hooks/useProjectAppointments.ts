import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/app/auth/AuthProvider";
import { toast } from "sonner";

export interface ProjectAppointment {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  status: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

/**
 * Hook unificado para citas/eventos de proyecto
 * - Cliente: lee desde v_client_events (solo visibilidad calculada)
 * - Staff/Admin: lee desde project_events (todos los registros)
 */
export function useProjectAppointments(projectId: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['project-appointments', projectId, user?.id],
    queryFn: async () => {
      if (!projectId) return [];

      // Determinar si es cliente
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user?.id || '')
        .limit(1)
        .single();
      
      const isClient = userRoles?.role_name === 'cliente';
      
      const today = new Date().toISOString();
      
      // Cliente: usar vista filtrada
      if (isClient) {
        const { data, error } = await supabase
          .from('v_client_events')
          .select('*')
          .eq('project_id', projectId)
          .gte('end_time', today)
          .order('start_time', { ascending: true });

        if (error) throw error;
        
        return (data || []).map(event => ({
          id: event.id,
          project_id: event.project_id,
          title: event.title,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          status: event.status,
          created_by: event.created_by,
          created_by_name: event.created_by_name,
          created_at: event.created_at,
        })) as ProjectAppointment[];
      }
      
      // Staff/Admin: usar tabla operativa
      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .gte('end_time', today)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      return (data || []) as ProjectAppointment[];
    },
    enabled: !!projectId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Mutation para crear evento (solo Staff/Admin)
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      status?: string;
    }) => {
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from('project_events')
        .insert({
          project_id: params.projectId,
          title: params.title,
          description: params.description || null,
          start_time: params.start_time,
          end_time: params.end_time,
          status: params.status || 'propuesta',
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento creado correctamente");
      queryClient.invalidateQueries({ queryKey: ['project-appointments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear el evento");
    },
  });
}

/**
 * Mutation para actualizar evento (solo Staff/Admin)
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      title?: string;
      description?: string;
      start_time?: string;
      end_time?: string;
      status?: string;
    }) => {
      const { id, ...updates } = params;
      
      const { error } = await supabase
        .from('project_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento actualizado");
      queryClient.invalidateQueries({ queryKey: ['project-appointments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el evento");
    },
  });
}

/**
 * Mutation para eliminar evento (solo Staff/Admin)
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento eliminado");
      queryClient.invalidateQueries({ queryKey: ['project-appointments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el evento");
    },
  });
}

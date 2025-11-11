import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type TaskPriority = 'baja' | 'media' | 'alta';
export type TaskRelatedType = 'lead' | 'account' | 'contact' | 'opportunity' | 'project';

export interface Task {
  id: string;
  subject: string;
  description?: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  related_to_type?: TaskRelatedType;
  related_to_id?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useTasks(
  search: string = "", 
  status?: TaskStatus, 
  assignedTo?: string,
  relatedToType?: TaskRelatedType,
  relatedToId?: string
) {
  return useQuery({
    queryKey: ['tasks', search, status, assignedTo, relatedToType, relatedToId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });
      
      if (search) {
        query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      if (relatedToType) {
        query = query.eq('related_to_type', relatedToType);
      }

      if (relatedToId) {
        query = query.eq('related_to_id', relatedToId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    ...CACHE_CONFIG.active,
  });
}

export function useTaskById(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Task;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...data,
          created_by: userId
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Tarea creada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al crear tarea: " + error.message);
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Task> & { id: string }) => {
      const { id, ...updateData } = data;
      const finalData = { ...updateData };
      
      // If marking as completed, set completed_at
      if (data.status === 'completada' && !data.completed_at) {
        finalData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(finalData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      toast.success("Tarea actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar tarea: " + error.message);
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Tarea eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar tarea: " + error.message);
    }
  });
}

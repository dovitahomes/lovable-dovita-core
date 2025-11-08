import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EmployeeCalendarEvent {
  id: string;
  user_id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  tipo: 'reunion' | 'vacaciones' | 'curso' | 'personal';
  proyecto_id?: string;
  created_at: string;
  updated_at: string;
}

export function useMyCalendarEvents(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['my-calendar-events', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('employee_calendar_events')
        .select('*')
        .order('fecha_inicio', { ascending: true });
      
      if (startDate) {
        query = query.gte('fecha_inicio', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('fecha_inicio', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as EmployeeCalendarEvent[];
    },
  });
}

export function useCalendarEventsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['calendar-events', year, month],
    queryFn: async () => {
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      
      const { data, error } = await supabase
        .from('employee_calendar_events')
        .select('*')
        .gte('fecha_inicio', startDate)
        .lte('fecha_inicio', endDate)
        .order('fecha_inicio', { ascending: true });
      
      if (error) throw error;
      return data as EmployeeCalendarEvent[];
    },
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<EmployeeCalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('employee_calendar_events')
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ description: "Evento creado exitosamente" });
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast({ 
        variant: "destructive",
        description: "Error al crear evento" 
      });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmployeeCalendarEvent> }) => {
      const { data, error } = await supabase
        .from('employee_calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ description: "Evento actualizado" });
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar evento" 
      });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_calendar_events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({ description: "Evento eliminado" });
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast({ 
        variant: "destructive",
        description: "Error al eliminar evento" 
      });
    },
  });
}

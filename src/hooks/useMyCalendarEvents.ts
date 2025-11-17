import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface CalendarFilters {
  projectId?: string;
  clientId?: string;
  eventType?: string;
  entityType?: string; // Nuevo filtro para tipo de entidad
  startDate?: string;
  endDate?: string;
}

export function useMyCalendarEvents(filters?: CalendarFilters) {
  const queryClient = useQueryClient();
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  return useQuery({
    queryKey: ['my-calendar-events', filters],
    queryFn: async () => {
      let query = supabase
        .from('project_events')
        .select(`
          *,
          projects (
            id,
            project_name,
            client_id,
            clients (name)
          ),
          leads (
            id,
            nombre_completo,
            email,
            telefono
          )
        `)
        .order('start_time', { ascending: true });
      
      // ✨ SIMPLIFICACIÓN: Las políticas RLS ahora manejan los permisos automáticamente
      // Ya no necesitamos construir filtros OR complejos en el frontend
      
      // Aplicar filtros adicionales
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      
      if (filters?.clientId) {
        query = query.eq('projects.client_id', filters.clientId);
      }
      
      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      
      if (filters?.startDate && filters?.endDate) {
        query = query
          .gte('start_time', filters.startDate)
          .lte('end_time', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error cargando eventos:', error);
        throw error;
      }

      console.log('✅ Eventos cargados:', {
        total: data?.length || 0,
        porTipo: {
          proyectos: data?.filter(e => e.entity_type === 'project').length || 0,
          leads: data?.filter(e => e.entity_type === 'lead').length || 0,
          personales: data?.filter(e => e.entity_type === 'personal').length || 0,
        },
        eventos: data?.map(e => ({
          id: e.id,
          title: e.title,
          entity_type: e.entity_type,
          project_id: e.project_id,
          lead_id: e.lead_id
        }))
      });

      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: false, // No refetch automático, usamos realtime
  });
}

// Hook para crear un nuevo evento
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: {
      project_id: string;
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      event_type: string;
      visibility: 'client' | 'team';
      location?: string;
      status?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('project_events')
        .insert({
          ...eventData,
          created_by: user.id,
          status: eventData.status || 'propuesta',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['project-events'] });
    },
  });
}

// Hook para actualizar un evento
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('project_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['project-events'] });
      queryClient.invalidateQueries({ queryKey: ['client-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['project-appointments'] });
    },
  });
}

// Hook para eliminar un evento
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['project-events'] });
      queryClient.invalidateQueries({ queryKey: ['client-upcoming-events'] });
      queryClient.invalidateQueries({ queryKey: ['project-appointments'] });
    },
  });
}

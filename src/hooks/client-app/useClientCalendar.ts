import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  notes?: string | null;
  created_by: string;
  created_by_name?: string;
  location?: string | null;
  meeting_link?: string | null;
}

export function useClientCalendar(projectId: string | null) {
  const query = useQuery({
    queryKey: ['client-calendar', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const today = new Date().toISOString();

      const { data, error } = await supabase
        .from('v_client_events')
        .select('*')
        .eq('project_id', projectId)
        .gte('end_time', today)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`No se pudieron cargar los eventos del calendario: ${error.message}`);
      }

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        start_at: event.start_time,
        end_at: event.end_time,
        notes: event.description,
        created_by: event.created_by,
        created_by_name: event.created_by_name,
        location: event.location || null,
        meeting_link: (event as any).meeting_link || null,
      })) as CalendarEvent[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

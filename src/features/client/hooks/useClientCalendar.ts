import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths } from "date-fns";

export interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  notes?: string | null;
  attendees?: Array<{ user_id: string; name?: string }> | null;
  created_by: string;
}

export function useClientCalendar(projectId: string | null) {
  return useQuery({
    queryKey: ['client-calendar', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const sixMonthsAgo = subMonths(new Date(), 6);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_at, end_at, notes, attendees, created_by')
        .eq('project_id', projectId)
        .gte('end_at', sixMonthsAgo.toISOString())
        .order('start_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(event => ({
        ...event,
        attendees: event.attendees as Array<{ user_id: string; name?: string }> | null,
      })) as CalendarEvent[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

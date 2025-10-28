import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectProgress {
  project_id: string;
  client_name: string;
  progress_pct: number;
}

export function useKpiProjectProgress() {
  return useQuery({
    queryKey: ['kpi-project-progress'],
    queryFn: async () => {
      // Get top 5 active projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, client_id, clients(name)')
        .eq('status', 'activo')
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (projectsError) throw projectsError;
      
      const result: ProjectProgress[] = await Promise.all(
        (projects || []).map(async (project) => {
          // Get gantt data for progress
          const { data: ganttPlans } = await supabase
            .from('gantt_plans')
            .select('id')
            .eq('project_id', project.id)
            .limit(1)
            .single();
          
          let progress_pct = 0;
          
          if (ganttPlans) {
            const { data: items } = await supabase
              .from('gantt_items')
              .select('major_id, end_date')
              .eq('gantt_id', ganttPlans.id);
            
            if (items && items.length > 0) {
              const uniqueMajors = new Set(items.map(i => i.major_id));
              const completedMajors = items.filter(i => new Date(i.end_date) < new Date()).length;
              progress_pct = (completedMajors / uniqueMajors.size) * 100;
            }
          }
          
          return {
            project_id: project.id,
            client_name: (project.clients as any)?.name || 'Sin cliente',
            progress_pct: Math.round(progress_pct)
          };
        })
      );
      
      return result;
    },
    staleTime: 60000,
  });
}

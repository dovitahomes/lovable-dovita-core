import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/contexts/client-app/ProjectContext";

// Temporary type definitions until they're added to supabase/types
type ClientProject = any;
type ClientProjectSummary = any;

export function useClientProjects(clientId: string | null) {
  return useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('v_client_projects')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return (data || []) as ClientProject[];
    },
    enabled: !!clientId,
  });
}

export function useClientProjectSummary(projectId: string | null) {
  return useQuery({
    queryKey: ['client-project-summary', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('v_client_project_summary')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ClientProjectSummary | null;
    },
    enabled: !!projectId,
  });
}

// Helper function to transform Supabase projects to UI format
export function transformToProjects(projects: any[]): Project[] {
  return projects.map((project: any) => ({
    id: project.project_id,
    clientName: project.client_name || 'Cliente',
    name: project.project_name || `Proyecto ${project.project_code}`,
    location: project.ubicacion_json?.ciudad || 'Sin ubicación',
    progress: project.progress_percent || 0,
    currentPhase: project.current_phase || 'En progreso',
    projectStage: project.project_status === 'diseno' ? 'design' : 'construction',
    totalAmount: project.total_amount || 0,
    totalPaid: project.total_paid || 0,
    totalPending: project.total_pending || 0,
    startDate: project.start_date || '',
    estimatedEndDate: project.estimated_end_date || '',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    renders: [],
    team: [],
    documents: [],
    phases: [],
  }));
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ClientProject, ClientProjectSummary } from "@/integrations/supabase/types";

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

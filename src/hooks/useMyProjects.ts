import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MyProject {
  id: string;
  client_name: string;
  status: string;
  unread_notifications: number;
  updated_at: string;
  progress_percentage: number;
}

export function useMyProjects() {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Obtener proyectos donde el usuario es colaborador
      const { data: collaborations, error: collabError } = await supabase
        .from('project_collaborators')
        .select('project_id')
        .eq('user_id', user.id);

      if (collabError) throw collabError;

      const projectIds = collaborations?.map(c => c.project_id) || [];
      
      if (projectIds.length === 0) {
        return [];
      }

      // Obtener datos completos de los proyectos
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          status,
          updated_at,
          clients (
            name
          )
        `)
        .in('id', projectIds)
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Obtener notificaciones no leídas del usuario
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, metadata')
        .eq('user_id', user.id)
        .eq('read', false);

      if (notifError) throw notifError;

      // Contar notificaciones por proyecto (las notificaciones guardan project_id en metadata)
      const notificationCounts = notifications?.reduce((acc, notif) => {
        const projectId = (notif.metadata as any)?.project_id;
        if (projectId && projectIds.includes(projectId)) {
          acc[projectId] = (acc[projectId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Obtener progreso de construcción por proyecto
      const projectsWithData = await Promise.all(
        (projects || []).map(async (project) => {
          // Calcular progreso basado en etapas de construcción
          const { data: stages } = await supabase
            .from('construction_stages')
            .select('progress')
            .eq('project_id', project.id);

          const totalStages = stages?.length || 0;
          const avgProgress = totalStages > 0
            ? Math.round(stages.reduce((sum, s) => sum + (s.progress || 0), 0) / totalStages)
            : 0;

          return {
            id: project.id,
            client_name: (project.clients as any)?.name || 'Sin cliente',
            status: project.status,
            unread_notifications: notificationCounts[project.id] || 0,
            updated_at: project.updated_at,
            progress_percentage: avgProgress,
          } as MyProject;
        })
      );

      return projectsWithData;
    },
  });
}

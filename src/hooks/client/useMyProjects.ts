import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function useMyProjects() {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    const stored = localStorage.getItem("client.activeProject");
    return stored || null;
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          status,
          terreno_m2,
          ubicacion_json,
          notas,
          created_at,
          clients!inner(id, name, email)
        `)
        .eq("clients.email", user.user.email);

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (projects.length > 0 && !currentProjectId) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem("client.activeProject", currentProjectId);
    }
  }, [currentProjectId]);

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0] || null;

  return {
    projects,
    currentProject,
    setCurrentProject: setCurrentProjectId,
    isLoading,
  };
}

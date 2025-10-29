import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface ClientProject {
  id: string;
  client_id: string;
  created_at: string;
}

const STORAGE_KEY = 'client.selectedProjectId';

export default function useClientProjects() {
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['client-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, client_id, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`No se pudieron cargar los proyectos: ${error.message}`);
      }

      return (data || []) as ClientProject[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Auto-select if only 1 project
  useEffect(() => {
    if (projects.length === 1 && !selectedProjectId) {
      setSelectedProjectIdState(projects[0].id);
      localStorage.setItem(STORAGE_KEY, projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Validate selected project still exists
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const projectExists = projects.some(p => p.id === selectedProjectId);
      if (!projectExists) {
        const newId = projects[0]?.id || null;
        setSelectedProjectIdState(newId);
        if (newId) {
          localStorage.setItem(STORAGE_KEY, newId);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [selectedProjectId, projects]);

  const setSelectedProjectId = (projectId: string | null) => {
    setSelectedProjectIdState(projectId);
    if (projectId) {
      localStorage.setItem(STORAGE_KEY, projectId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    projects,
    loading: isLoading,
    error,
    selectedProjectId,
    setSelectedProjectId,
  };
}

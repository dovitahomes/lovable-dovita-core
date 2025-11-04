import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Project {
  id: string;
  clientName: string;
  name: string;
  location: string;
  progress: number;
  currentPhase: string;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  startDate: string;
  estimatedEndDate: string;
  heroImage: string;
  renders: Array<{
    id: number;
    url: string;
    title: string;
    phase: string;
    date: string;
  }>;
  team: Array<{
    id: number;
    name: string;
    role: string;
    avatar: string;
    phone: string;
    email: string;
  }>;
}

interface ProjectContextType {
  currentProject: Project | null;
  availableProjects: Project[];
  setCurrentProject: (projectId: string) => void;
  hasMultipleProjects: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, projects }: { children: ReactNode; projects: Project[] }) {
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const saved = localStorage.getItem('currentProjectId');
    return saved && projects.some(p => p.id === saved) ? saved : projects[0]?.id || '';
  });

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0] || null;
  const hasMultipleProjects = projects.length > 1;

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('currentProjectId', currentProjectId);
    }
  }, [currentProjectId]);

  const setCurrentProject = (projectId: string) => {
    if (projects.some(p => p.id === projectId)) {
      setCurrentProjectId(projectId);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        availableProjects: projects,
        setCurrentProject,
        hasMultipleProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

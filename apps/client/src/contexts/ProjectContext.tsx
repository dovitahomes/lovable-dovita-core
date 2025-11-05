import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getClientProjects } from '@/lib/client-data';
import type { Document, Phase } from '@/lib/client-data';

export interface Project {
  id: string;
  clientName: string;
  name: string;
  location: string;
  progress: number;
  currentPhase: string;
  projectStage: 'design' | 'construction';
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
  documents: Document[];
  phases: Phase[];
}

interface ProjectContextType {
  currentProject: Project | null;
  availableProjects: Project[];
  setCurrentProject: (projectId: string) => void;
  hasMultipleProjects: boolean;
  loadProjects: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, projects: initialProjects }: { children: ReactNode; projects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    const saved = localStorage.getItem('currentProjectId');
    return saved && initialProjects.some(p => p.id === saved) ? saved : initialProjects[0]?.id || '';
  });

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0] || null;
  const hasMultipleProjects = projects.length > 1;

  const loadProjects = async (userId: string) => {
    setIsLoading(true);
    try {
      const projectsData = await getClientProjects(userId);
      const mappedProjects: Project[] = projectsData.map((p: any) => ({
        id: p.project_id,
        clientName: 'Cliente',
        name: p.project_name,
        location: 'Ubicación',
        progress: 0,
        currentPhase: 'En progreso',
        projectStage: 'construction' as const,
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        startDate: p.created_at,
        estimatedEndDate: '',
        heroImage: '',
        renders: [],
        team: [],
        documents: [],
        phases: [],
      }));
      setProjects(mappedProjects);
      
      // Auto-select first project if none selected
      if (!currentProjectId && mappedProjects.length > 0) {
        const firstId = mappedProjects[0].id;
        setCurrentProjectId(firstId);
        localStorage.setItem('currentProjectId', firstId);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        hasMultipleProjects,
        loadProjects,
        isLoading,
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

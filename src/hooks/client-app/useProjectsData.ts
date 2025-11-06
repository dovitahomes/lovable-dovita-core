import { useMemo } from 'react';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { useAuthClientId } from './useAuthClientId';
import { useClientProjects, useClientProjectSummary } from './useClientProjects';
import { useClientDocuments, useClientPhotos } from './useClientData';
import { mockClientData } from '@/lib/client-app/client-data';
import { transformProjectToUI } from '@/lib/client-app/dataAdapters';
import type { Project } from '@/contexts/client-app/ProjectContext';

export function useProjectsData() {
  const { source, forceClientId, isPreviewMode } = useDataSource();
  const { data: authClient } = useAuthClientId();
  
  // Determinar qué client_id usar
  const effectiveClientId = useMemo(() => {
    if (isPreviewMode && forceClientId) {
      return forceClientId;
    }
    return authClient?.id || null;
  }, [isPreviewMode, forceClientId, authClient?.id]);
  
  // Datos reales de Supabase
  const { data: realProjects = [], isLoading: loadingProjects } = useClientProjects(effectiveClientId);
  
  // Para cada proyecto, obtener su summary, documentos y fotos
  const transformedRealProjects = useMemo(() => {
    if (source === 'mock') return [];
    
    return realProjects.map(project => {
      // Por ahora crear proyecto básico, más adelante se puede mejorar
      // cargando summary, docs y photos para cada proyecto
      return transformProjectToUI(project);
    });
  }, [realProjects, source]);
  
  // Retornar según fuente
  if (source === 'mock') {
    return {
      projects: mockClientData.projects,
      clientName: mockClientData.clientName,
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    projects: transformedRealProjects,
    clientName: authClient?.name || effectiveClientId ? 'Cliente' : '',
    isLoading: loadingProjects,
    source: 'real' as const,
  };
}

/**
 * Hook para obtener datos completos de un proyecto específico
 */
export function useFullProjectData(projectId: string | null) {
  const { source } = useDataSource();
  
  const { data: summary } = useClientProjectSummary(projectId);
  const { data: documents = [] } = useClientDocuments(projectId);
  const { data: photos = [] } = useClientPhotos(projectId);
  
  if (source === 'mock') {
    const mockProject = mockClientData.projects.find(p => p.id === projectId);
    return {
      summary: mockProject ? {
        project_id: mockProject.id,
        project_name: mockProject.name,
        start_date: mockProject.startDate,
        estimated_end_date: mockProject.estimatedEndDate,
        progress_percent: mockProject.progress,
        total_amount: mockProject.totalAmount,
        total_paid: mockProject.totalPaid,
        total_pending: mockProject.totalPending,
        last_payment_at: null,
        status: mockProject.projectStage,
      } : null,
      documents: mockProject?.documents || [],
      photos: mockProject?.renders || [],
    };
  }
  
  return {
    summary,
    documents,
    photos,
  };
}

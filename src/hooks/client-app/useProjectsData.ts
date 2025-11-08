import { useMemo, useEffect } from 'react';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { useAuthClientId } from './useAuthClientId';
import { useClientDocuments, useClientPhotos } from './useClientData';
import { mockClientData } from '@/lib/client-app/client-data';
import { transformProjectToUI } from '@/lib/client-app/dataAdapters';
import type { Project } from '@/contexts/client-app/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useProjectsData() {
  const { source, forceClientId, isPreviewMode, setSource } = useDataSource();
  const { data: authClient } = useAuthClientId();
  
  // Determinar qué client_id usar
  const effectiveClientId = useMemo(() => {
    if (isPreviewMode && forceClientId) {
      return forceClientId;
    }
    return authClient?.id || null;
  }, [isPreviewMode, forceClientId, authClient?.id]);
  
  // Datos reales de Supabase - inline query
  const { data: realProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['client-projects', effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return [];
      
      const { data, error } = await supabase
        .from('v_client_projects')
        .select('*')
        .eq('client_id', effectiveClientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveClientId,
    staleTime: 1000 * 60 * 2,
  });
  
  // AUTO-CORREGIR: Si está en preview mode, source es 'real' pero no hay proyectos,
  // cambiar automáticamente a mock para evitar quedarse en loading infinito
  useEffect(() => {
    if (isPreviewMode && source === 'real' && !loadingProjects && realProjects.length === 0) {
      console.log('[useProjectsData] No hay clientes reales en preview mode, cambiando a mock');
      setSource('mock');
    }
  }, [isPreviewMode, source, loadingProjects, realProjects.length, setSource]);
  
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
  
  // Inline query for project summary
  const { data: summary } = useQuery({
    queryKey: ['client-project-summary', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('v_client_project_summary')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });
  
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

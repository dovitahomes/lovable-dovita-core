import { useMemo } from 'react';
import { useDataSource } from '@/contexts/DataSourceContext';
import { useAuthClientId } from './useAuthClientId';
import { useClientProjects } from './useClientProjects';
import { mockClientData } from '@/lib/client-data';

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
  const { data: realProjects = [], isLoading: realLoading } = useClientProjects(effectiveClientId);
  
  // Transformar datos reales al formato básico de la UI
  const transformedRealProjects = useMemo(() => {
    return realProjects.map(p => ({
      id: p.project_id,
      client_id: p.client_id,
      client_name: p.client_name,
      status: p.project_status,
      terreno_m2: p.terreno_m2,
      ubicacion_json: p.ubicacion_json,
      created_at: p.created_at,
    }));
  }, [realProjects]);
  
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
    isLoading: realLoading,
    source: 'real' as const,
  };
}

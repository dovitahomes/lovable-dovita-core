import { useMemo } from 'react';
import { useDataSource } from '@/contexts/DataSourceContext';
import { 
  useClientDocuments, 
  useClientPhotos, 
  useClientMinistrations,
  useClientFinancialSummary,
  useClientBudgetCategories,
  useClientAppointments
} from './useClientData';
import { mockClientData } from '@/lib/client-data';

export function useUnifiedDocuments(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realDocs = [], isLoading } = useClientDocuments(projectId);
  
  if (source === 'mock') {
    const mockProject = mockClientData.projects.find(p => p.id === projectId);
    return {
      data: mockProject?.documents || [],
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realDocs,
    isLoading,
    source: 'real' as const,
  };
}

export function useUnifiedPhotos(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realPhotos = [], isLoading } = useClientPhotos(projectId);
  
  if (source === 'mock') {
    const mockProject = mockClientData.projects.find(p => p.id === projectId);
    return {
      data: mockProject?.renders || [],
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realPhotos,
    isLoading,
    source: 'real' as const,
  };
}

export function useUnifiedMinistrations(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realMinis = [], isLoading } = useClientMinistrations(projectId);
  
  if (source === 'mock') {
    // Mock data no tiene ministraciones, retornar array vacío
    return {
      data: [],
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realMinis,
    isLoading,
    source: 'real' as const,
  };
}

export function useUnifiedFinancialSummary(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realSummary, isLoading } = useClientFinancialSummary(projectId);
  
  if (source === 'mock') {
    const mockProject = mockClientData.projects.find(p => p.id === projectId);
    if (!mockProject) {
      return { data: null, isLoading: false, source: 'mock' as const };
    }
    
    return {
      data: {
        project_id: projectId || '',
        total_amount: mockProject.totalAmount,
        paid_amount: mockProject.totalPaid,
        pending_amount: mockProject.totalPending,
        spent_amount: mockProject.totalPaid, // Aproximación
        last_payment_at: null,
      },
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realSummary,
    isLoading,
    source: 'real' as const,
  };
}

export function useUnifiedBudgetCategories(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realCategories = [], isLoading } = useClientBudgetCategories(projectId);
  
  if (source === 'mock') {
    // Mock data no tiene categorías presupuestales
    return {
      data: [],
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realCategories,
    isLoading,
    source: 'real' as const,
  };
}

export function useUnifiedAppointments(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realAppts = [], isLoading } = useClientAppointments(projectId);
  
  if (source === 'mock') {
    // Mock data no tiene appointments
    return {
      data: [],
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  return {
    data: realAppts,
    isLoading,
    source: 'real' as const,
  };
}

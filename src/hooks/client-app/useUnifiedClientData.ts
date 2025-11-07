import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { 
  useClientDocuments, 
  useClientPhotos, 
  useClientMinistrations,
  useClientFinancialSummary,
  useClientBudgetCategories,
  useClientAppointments
} from './useClientData';
import { mockClientData, mockPhotos, mockMinistraciones, budgetCategories, mockAppointments, type Document } from '@/lib/client-app/client-data';

/**
 * Unified documents hook - switches between mock and real data
 */
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
  
  // Transform real data to match UI format (using actual column names from v_client_documents)
  const transformedDocs = realDocs.map(doc => ({
    id: doc.id || '',
    name: doc.nombre || '',
    size: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : '0 MB',
    date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-MX') : '',
    type: (doc.file_type?.includes('pdf') ? 'pdf' : 'image') as 'pdf' | 'image',
    category: (doc.tipo_carpeta?.toLowerCase() || 'proyecto') as Document['category'],
    url: doc.file_url || undefined,
  }));
  
  return {
    data: transformedDocs,
    isLoading,
    source: 'real' as const,
  };
}

/**
 * Unified photos hook - switches between mock and real data
 */
export function useUnifiedPhotos(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realPhotos = [], isLoading } = useClientPhotos(projectId);
  
  if (source === 'mock') {
    return {
      data: mockPhotos.filter(p => p.projectId === projectId),
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  // Transform real data to match UI format (using actual column names from v_client_photos)
  const transformedPhotos = realPhotos.map(photo => ({
    id: photo.id || '',
    projectId: photo.project_id || '',
    url: photo.file_url || '',
    phase: 'Construcción', // phase_name doesn't exist in v_client_photos
    date: photo.fecha_foto ? new Date(photo.fecha_foto).toISOString().split('T')[0] : '',
    description: photo.descripcion || '',
    location: { 
      lat: photo.latitude || 0, 
      lng: photo.longitude || 0 
    }
  }));
  
  return {
    data: transformedPhotos,
    isLoading,
    source: 'real' as const,
  };
}

/**
 * Unified ministrations hook - switches between mock and real data
 */
export function useUnifiedMinistrations(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realMinistrations = [], isLoading } = useClientMinistrations(projectId);
  
  if (source === 'mock') {
    return {
      data: mockMinistraciones.filter(m => m.projectId === projectId),
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  // Transform real data to match UI format
  // Note: status field doesn't exist in v_client_ministrations yet
  const transformedMinistrations = realMinistrations.map(m => {
    const now = new Date();
    const miniDate = new Date(m.date || '');
    let status: 'paid' | 'pending' | 'future' = 'future';
    
    if (miniDate < now) {
      status = 'paid'; // Assume past dates are paid
    } else if (miniDate.toDateString() === now.toDateString()) {
      status = 'pending';
    }
    
    return {
      id: m.seq || 0,
      projectId: m.project_id || '',
      amount: m.percent ? (m.percent / 100) * 4500000 : 0, // Estimate based on percent
      date: m.date || '',
      status,
      concept: m.label || `Ministración ${m.seq}`,
    };
  });
  
  return {
    data: transformedMinistrations,
    isLoading,
    source: 'real' as const,
  };
}

/**
 * Unified financial summary hook - switches between mock and real data
 */
export function useUnifiedFinancialSummary(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realSummary, isLoading } = useClientFinancialSummary(projectId);
  
  if (source === 'mock') {
    const mockProject = mockClientData.projects.find(p => p.id === projectId);
    if (!mockProject) {
      return {
        data: null,
        isLoading: false,
        source: 'mock' as const,
      };
    }
    
    return {
      data: {
        totalAmount: mockProject.totalAmount,
        totalPaid: mockProject.totalPaid,
        totalPending: mockProject.totalPending,
      },
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  // Transform real data to match UI format
  const transformedSummary = realSummary ? {
    totalAmount: realSummary.total_amount || 0,
    totalPaid: realSummary.paid_amount || 0,
    totalPending: realSummary.pending_amount || 0,
    lastPaymentAt: realSummary.last_payment_at,
  } : null;
  
  return {
    data: transformedSummary,
    isLoading,
    source: 'real' as const,
  };
}

/**
 * Unified budget categories hook - switches between mock and real data
 */
export function useUnifiedBudgetCategories(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realCategories = [], isLoading } = useClientBudgetCategories(projectId);
  
  if (source === 'mock') {
    return {
      data: budgetCategories.filter(b => b.projectId === projectId),
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  // Transform real data to match UI format
  const transformedCategories = realCategories.map(cat => ({
    projectId: cat.project_id || '',
    name: cat.name || 'Sin categoría', // Use 'name' field from view
    budgeted: cat.budgeted || 0,
    spent: cat.spent || 0,
  }));
  
  return {
    data: transformedCategories,
    isLoading,
    source: 'real' as const,
  };
}

/**
 * Unified appointments hook - switches between mock and real data
 */
export function useUnifiedAppointments(projectId: string | null) {
  const { source } = useDataSource();
  const { data: realAppointments = [], isLoading } = useClientAppointments(projectId);
  
  if (source === 'mock') {
    return {
      data: mockAppointments.filter(a => a.projectId === projectId),
      isLoading: false,
      source: 'mock' as const,
    };
  }
  
  // Transform real data to match UI format
  const transformedAppointments = realAppointments.map(apt => {
    const startDate = new Date(apt.starts_at || '');
    const endDate = new Date(apt.ends_at || '');
    const duration = apt.ends_at && apt.starts_at 
      ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      : 60;
    
    return {
      id: apt.appointment_id || '',
      projectId: apt.project_id || '',
      type: apt.title || 'Cita',
      date: apt.starts_at ? new Date(apt.starts_at).toISOString().split('T')[0] : '',
      time: apt.starts_at ? new Date(apt.starts_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      duration,
      status: 'confirmed' as const,
      teamMember: {
        id: 1,
        name: 'Equipo Dovita',
        role: 'Arquitecto',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team'
      },
      location: apt.location || 'Por confirmar',
      notes: apt.notes || '',
      isVirtual: apt.location?.toLowerCase().includes('virtual') || apt.location?.toLowerCase().includes('meet') || false,
      // meeting_link field doesn't exist yet in calendar_events table
      meetingLink: undefined,
    };
  });
  
  return {
    data: transformedAppointments,
    isLoading,
    source: 'real' as const,
  };
}

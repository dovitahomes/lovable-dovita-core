/**
 * Client Data Hooks
 * 
 * Hooks unificados que consumen:
 * - Mock data si useMock=true (solo preview/demos)
 * - Datos reales de vistas v_client_* si useMock=false
 * 
 * Incluye filtros defensivos por project_id/client_id
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientDataMode } from "@/contexts/client-app/ClientDataModeProvider";
import { getSignedUrl } from "@/lib/storage/storage-helpers";
import { 
  mockPhotos, 
  mockMinistraciones,
  mockAppointments,
  mockDocuments
} from "@/lib/client-app/client-data";

// Helper to generate signed URLs
async function getSignedFileUrl(fileUrl: string | null): Promise<string> {
  if (!fileUrl) return "";
  
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  const parts = fileUrl.split('/');
  const knownBuckets = ['project_docs', 'project_photos', 'design-deliverables'];
  
  let bucket = 'project_docs';
  let path = fileUrl;
  
  if (knownBuckets.includes(parts[0])) {
    bucket = parts[0];
    path = parts.slice(1).join('/');
  }
  
  try {
    const { url } = await getSignedUrl({ bucket: bucket as any, path, expiresInSeconds: 60 });
    return url;
  } catch (error) {
    console.error('[useClientData] Error generating signed URL:', error);
    return fileUrl;
  }
}

/**
 * Fetch documents for a project
 */
export function useClientDocuments(projectId: string | null) {
  const { useMock } = useClientDataMode();
  
  return useQuery({
    queryKey: ['client-documents', projectId, useMock],
    queryFn: async () => {
      if (useMock) {
        if (!projectId) return [];
        return mockDocuments.filter(doc => doc.projectId === projectId);
      }
      
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process signed URLs in parallel with batching
      const documentsWithUrls = await Promise.all(
        (data || []).map(async (doc) => ({
          id: doc.id,
          projectId: doc.project_id,
          name: doc.nombre || 'Sin nombre',
          size: doc.file_size || 0,
          date: doc.created_at || new Date().toISOString(),
          type: doc.file_type || 'application/pdf',
          category: doc.tipo_carpeta || 'general',
          url: await getSignedFileUrl(doc.file_url),
        }))
      );
      
      return documentsWithUrls;
    },
    enabled: !!projectId || useMock,
    staleTime: 1000 * 60 * 5, // Aumentado a 5min para reducir llamadas
    gcTime: 1000 * 60 * 10, // Cache por 10min
  });
}

/**
 * Fetch photos for a project
 */
export function useClientPhotos(projectId: string | null) {
  const { useMock } = useClientDataMode();
  
  return useQuery({
    queryKey: ['client-photos', projectId, useMock],
    queryFn: async () => {
      if (useMock) {
        return mockPhotos.filter(photo => photo.projectId === projectId);
      }
      
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('fecha_foto', { ascending: false });
      
      if (error) throw error;
      
      // Process signed URLs
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => ({
          id: photo.id,
          projectId: photo.project_id,
          url: await getSignedFileUrl(photo.file_url),
          phase: 'Construcción', // Las vistas SQL no tienen fase, usar fijo
          date: photo.fecha_foto || new Date().toISOString(),
          description: photo.descripcion || 'Sin descripción',
          location: { lat: photo.latitude || 0, lng: photo.longitude || 0 },
        }))
      );
      
      return photosWithUrls;
    },
    enabled: !!projectId || useMock,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch ministrations (payments) for a project
 */
export function useClientMinistrations(projectId: string | null) {
  const { useMock } = useClientDataMode();
  
  return useQuery({
    queryKey: ['client-ministrations', projectId, useMock],
    queryFn: async () => {
      if (useMock) {
        if (!projectId) return [];
        return mockMinistraciones.filter(m => m.projectId === projectId);
      }
      
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_ministrations')
        .select('*')
        .eq('project_id', projectId)
        .order('seq', { ascending: true });
      
      if (error) throw error;
      
      // Transform to match expected format
      return (data || []).map((m: any) => {
        const paymentDate = new Date(m.date || new Date());
        const now = new Date();
        const isPast = paymentDate < now;
        
        return {
          id: m.seq?.toString() || crypto.randomUUID(),
          projectId: m.project_id,
          amount: (m.percent / 100) * 5000000, // Mock calculation based on percent
          date: m.date || new Date().toISOString(),
          status: isPast ? 'paid' : 'future',
          concept: m.label || `Ministración ${m.seq}`,
        };
      });
    },
    enabled: !!projectId || useMock,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch financial summary for a project
 */
export function useClientFinancialSummary(projectId: string | null) {
  const { useMock } = useClientDataMode();
  
  return useQuery({
    queryKey: ['client-financial-summary', projectId, useMock],
    queryFn: async () => {
      if (useMock) {
        // Calculate from mock ministrations
        const projectPayments = mockMinistraciones.filter(m => m.projectId === projectId);
        const totalPaid = projectPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        const totalPending = projectPayments
          .filter(p => p.status !== 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        
        return {
          total_amount: totalPaid + totalPending,
          spent_amount: totalPaid,
          remaining: totalPending,
        };
      }
      
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('v_client_financial_summary')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId || useMock,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch budget categories for a project
 */
export function useClientBudgetCategories(projectId: string | null) {
  const { useMock } = useClientDataMode();
  
  return useQuery({
    queryKey: ['client-budget-categories', projectId, useMock],
    queryFn: async () => {
      if (useMock) {
        // Mock budget categories
        return [
          { project_id: projectId, mayor_name: 'Albañilería', budgeted: 50000, spent: 30000 },
          { project_id: projectId, mayor_name: 'Instalaciones', budgeted: 40000, spent: 25000 },
          { project_id: projectId, mayor_name: 'Acabados', budgeted: 60000, spent: 10000 },
        ];
      }
      
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_budget_categories')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId || useMock,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch appointments for a project
 */
export function useClientAppointments(projectId: string | null) {
  const { useMock } = useClientDataMode();
  
  return useQuery({
    queryKey: ['client-appointments', projectId, useMock],
    queryFn: async () => {
      if (useMock) {
        if (!projectId) return [];
        return mockAppointments.filter(apt => apt.projectId === projectId);
      }
      
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_events')
        .select('*')
        .eq('project_id', projectId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map((apt: any) => ({
        id: apt.id,
        projectId: apt.project_id,
        type: apt.tipo || 'General',
        date: apt.fecha || new Date().toISOString().split('T')[0],
        time: apt.hora || '10:00',
        duration: apt.duracion_min || 60,
        status: apt.status || 'pending',
        teamMember: {
          name: apt.responsable_nombre || 'Equipo',
          role: apt.responsable_rol || 'Coordinador',
          avatar: '/placeholder.svg',
        },
        location: apt.ubicacion || 'Obra',
        notes: apt.notas || '',
        isVirtual: apt.es_virtual || false,
        meetingLink: apt.link_reunion || null,
      }));
    },
    enabled: !!projectId || useMock,
    staleTime: 1000 * 60 * 2,
  });
}

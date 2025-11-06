import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Temporary type definitions until they're added to supabase/types
type ClientDocument = any;
type ClientPhoto = any;
type ClientMinistration = any;
type ClientFinancialSummary = any;
type ClientBudgetCategory = any;
type ClientAppointment = any;

export function useClientDocuments(projectId: string | null) {
  return useQuery({
    queryKey: ['client-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ClientDocument[];
    },
    enabled: !!projectId,
  });
}

export function useClientPhotos(projectId: string | null) {
  return useQuery({
    queryKey: ['client-photos', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('taken_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ClientPhoto[];
    },
    enabled: !!projectId,
  });
}

export function useClientMinistrations(projectId: string | null) {
  return useQuery({
    queryKey: ['client-ministrations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_ministrations')
        .select('*')
        .eq('project_id', projectId)
        .order('seq', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ClientMinistration[];
    },
    enabled: !!projectId,
  });
}

export function useClientFinancialSummary(projectId: string | null) {
  return useQuery({
    queryKey: ['client-financial-summary', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('v_client_financial_summary')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ClientFinancialSummary | null;
    },
    enabled: !!projectId,
  });
}

export function useClientBudgetCategories(projectId: string | null) {
  return useQuery({
    queryKey: ['client-budget-categories', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_budget_categories')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return (data || []) as ClientBudgetCategory[];
    },
    enabled: !!projectId,
  });
}

export function useClientAppointments(projectId: string | null) {
  return useQuery({
    queryKey: ['client-appointments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_appointments')
        .select('*')
        .eq('project_id', projectId)
        .order('starts_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ClientAppointment[];
    },
    enabled: !!projectId,
  });
}

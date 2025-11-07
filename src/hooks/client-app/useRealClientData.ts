import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedUrl } from "@/lib/storage/storage-helpers";

// Helper to process signed URLs for files
async function processFileUrl(fileUrl: string | null): Promise<string> {
  if (!fileUrl) return "";
  
  // If already a full URL, return as-is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // If it's a relative path, generate signed URL
  // Format expected: bucket/path/to/file or just path/to/file
  const parts = fileUrl.split('/');
  
  // Assume first part might be bucket name, rest is path
  let bucket = 'project_docs'; // default bucket
  let path = fileUrl;
  
  // Common bucket names to detect
  const knownBuckets = ['project_docs', 'design-deliverables', 'cfdi', 'firmas', 'documentos'];
  if (knownBuckets.includes(parts[0])) {
    bucket = parts[0];
    path = parts.slice(1).join('/');
  }
  
  try {
    const { url } = await getSignedUrl({ bucket: bucket as any, path, expiresInSeconds: 300 });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return fileUrl; // Fallback to original
  }
}

/**
 * Hook to fetch real client data from Supabase views
 * Inputs: clientId and projectId from context/PreviewBar
 */
export function useRealClientData(clientId: string | null, projectId: string | null) {
  // Fetch client projects list
  const { data: projects, isLoading: loadingProjects, error: errorProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['real-client-projects', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('v_client_projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch project summary
  const { data: projectSummary, isLoading: loadingSummary, error: errorSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['real-project-summary', projectId],
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

  // Fetch photos
  const { data: photos, isLoading: loadingPhotos, error: errorPhotos, refetch: refetchPhotos } = useQuery({
    queryKey: ['real-client-photos', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('fecha_foto', { ascending: false });
      
      if (error) throw error;
      
      // Process signed URLs for photos
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => ({
          ...photo,
          url: await processFileUrl(photo.file_url),
        }))
      );
      
      return photosWithUrls;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch documents
  const { data: documents, isLoading: loadingDocuments, error: errorDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ['real-client-documents', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Process signed URLs for documents
      const documentsWithUrls = await Promise.all(
        (data || []).map(async (doc) => ({
          ...doc,
          url: await processFileUrl(doc.file_url),
        }))
      );
      
      return documentsWithUrls;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch ministrations
  const { data: ministrations, isLoading: loadingMinistrations, error: errorMinistrations, refetch: refetchMinistrations } = useQuery({
    queryKey: ['real-client-ministrations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('v_client_ministrations')
        .select('*')
        .eq('project_id', projectId)
        .order('seq', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch financial summary
  const { data: financialSummary, isLoading: loadingFinancial, error: errorFinancial, refetch: refetchFinancial } = useQuery({
    queryKey: ['real-client-financial', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('vw_client_financial_summary')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  // Aggregate loading and error states
  const isLoading = loadingProjects || loadingSummary || loadingPhotos || loadingDocuments || loadingMinistrations || loadingFinancial;
  const error = errorProjects || errorSummary || errorPhotos || errorDocuments || errorMinistrations || errorFinancial;

  // Refresh function to invalidate all queries
  const refresh = () => {
    refetchProjects();
    refetchSummary();
    refetchPhotos();
    refetchDocuments();
    refetchMinistrations();
    refetchFinancial();
  };

  return {
    data: {
      projects: projects || [],
      projectSummary,
      photos: photos || [],
      documents: documents || [],
      ministrations: ministrations || [],
      financialSummary,
    },
    isLoading,
    error,
    refresh,
  };
}

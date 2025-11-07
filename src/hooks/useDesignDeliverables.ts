import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { uploadToBucket, getSignedUrl, deleteFromBucket } from "@/lib/storage/storage-helpers";

interface DesignDeliverable {
  id: string;
  project_id: string;
  phase_id?: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export function useDesignDeliverables(projectId: string) {
  return useQuery({
    queryKey: ['design-deliverables', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_deliverables')
        .select('*, design_phases(phase_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUploadDesignDeliverables(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, phaseId, description }: { 
      files: File[]; 
      phaseId?: string;
      description?: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      const uploadedFiles = [];
      
      for (const file of files) {
        const { path } = await uploadToBucket({
          bucket: 'design-deliverables',
          projectId,
          file,
          filename: file.name
        });
        
        const { data, error: insertError } = await supabase
          .from('design_deliverables')
          .insert({
            project_id: projectId,
            phase_id: phaseId,
            file_name: file.name,
            file_url: path,
            file_type: file.type,
            file_size: file.size,
            description,
            uploaded_by: user?.id,
          })
          .select()
          .single();
        
        if (insertError) {
          // Cleanup uploaded file if DB insert fails
          await deleteFromBucket('design-deliverables', path);
          throw insertError;
        }
        uploadedFiles.push(data);
      }
      
      return uploadedFiles;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-deliverables', projectId] });
      toast({ description: "Archivos subidos exitosamente" });
    },
    onError: (error) => {
      console.error('Error uploading deliverables:', error);
      toast({ 
        variant: "destructive",
        description: "Error al subir archivos" 
      });
    },
  });
}

export function useSignedUrl(filePath?: string) {
  return useQuery({
    queryKey: ['signed-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;
      
      const { url } = await getSignedUrl({
        bucket: 'design-deliverables',
        path: filePath,
        expiresInSeconds: 600
      });
      
      return url;
    },
    enabled: !!filePath,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: { phase_id?: string; description?: string } 
    }) => {
      const { data, error } = await supabase
        .from('design_deliverables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-deliverables', data.project_id] });
      toast({ description: "Entregable actualizado" });
    },
    onError: (error) => {
      console.error('Error updating deliverable:', error);
      toast({ 
        variant: "destructive",
        description: "Error al actualizar entregable" 
      });
    },
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, fileUrl, projectId }: { 
      id: string; 
      fileUrl: string;
      projectId: string;
    }) => {
      // Delete from storage
      await deleteFromBucket('design-deliverables', fileUrl);
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('design_deliverables')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['design-deliverables', data.projectId] });
      toast({ description: "Entregable eliminado" });
    },
    onError: (error) => {
      console.error('Error deleting deliverable:', error);
      toast({ 
        variant: "destructive",
        description: "Error al eliminar entregable" 
      });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadToBucket, getSignedUrl, deleteFromBucket } from "@/lib/storage-helpers";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export type AttachmentEntityType = 'lead' | 'account' | 'contact' | 'opportunity' | 'task';

export interface CrmAttachment {
  id: string;
  entity_type: AttachmentEntityType;
  entity_id: string;
  file_name: string;
  file_url: string; // Relative path
  file_type?: string;
  file_size?: number;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
}

const BUCKET_NAME = 'crm-attachments';

export function useCrmAttachments(entityType: AttachmentEntityType, entityId: string) {
  return useQuery({
    queryKey: ['crm-attachments', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CrmAttachment[];
    },
    ...CACHE_CONFIG.active,
  });
}

export function useUploadCrmAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      entityType, 
      entityId, 
      file, 
      notes 
    }: { 
      entityType: AttachmentEntityType; 
      entityId: string; 
      file: File; 
      notes?: string;
    }) => {
      // Upload to storage
      const { path } = await uploadToBucket({ 
        bucket: BUCKET_NAME, 
        projectId: entityId, 
        file 
      });
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      // Insert record
      const { data, error } = await supabase
        .from('crm_attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_url: path,
          file_type: file.type,
          file_size: file.size,
          notes,
          uploaded_by: userId
        })
        .select()
        .single();
      
      if (error) {
        // Cleanup on error
        try {
          await deleteFromBucket(BUCKET_NAME, path);
        } catch (e) {
          console.error('Error cleaning up file:', e);
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['crm-attachments', variables.entityType, variables.entityId] 
      });
      toast.success("Archivo adjunto exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al subir archivo: " + error.message);
    }
  });
}

export function useDeleteCrmAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attachment: CrmAttachment) => {
      // Delete from storage first
      try {
        await deleteFromBucket(BUCKET_NAME, attachment.file_url);
      } catch (e) {
        console.error('Error deleting file from storage:', e);
        // Continue to delete DB record even if storage deletion fails
      }
      
      // Delete record
      const { error } = await supabase
        .from('crm_attachments')
        .delete()
        .eq('id', attachment.id);
      
      if (error) throw error;
    },
    onSuccess: (_, attachment) => {
      queryClient.invalidateQueries({ 
        queryKey: ['crm-attachments', attachment.entity_type, attachment.entity_id] 
      });
      toast.success("Archivo eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar archivo: " + error.message);
    }
  });
}

export async function getAttachmentSignedUrl(relativePath: string): Promise<string> {
  const { url } = await getSignedUrl({ 
    bucket: BUCKET_NAME, 
    path: relativePath 
  });
  return url;
}

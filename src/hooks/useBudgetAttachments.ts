import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadToBucket, getSignedUrl, deleteFromBucket } from "@/lib/storage-helpers";
import { CACHE_CONFIG } from "@/lib/queryConfig";

const BUCKET_NAME = 'documentos' as const;

export interface BudgetAttachment {
  id: string;
  budget_item_id: string;
  file_name: string;
  file_url: string; // Relative path
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export function useBudgetAttachments(budgetItemId?: string) {
  return useQuery({
    queryKey: ['budget-attachments', budgetItemId],
    queryFn: async () => {
      if (!budgetItemId) return [];
      
      const { data, error } = await supabase
        .from('budget_attachments')
        .select('*')
        .eq('budget_item_id', budgetItemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BudgetAttachment[];
    },
    enabled: !!budgetItemId,
    ...CACHE_CONFIG.active,
  });
}

export function useUploadBudgetAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      budgetItemId, 
      file 
    }: { 
      budgetItemId: string; 
      file: File; 
    }) => {
      // Upload to storage
      const { path } = await uploadToBucket({ 
        bucket: BUCKET_NAME, 
        projectId: budgetItemId, 
        file 
      });
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      // Insert record
      const { data, error } = await supabase
        .from('budget_attachments')
        .insert({
          budget_item_id: budgetItemId,
          file_name: file.name,
          file_url: path,
          file_type: file.type,
          file_size: file.size,
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
        queryKey: ['budget-attachments', variables.budgetItemId] 
      });
      toast.success("Archivo adjunto exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al subir archivo: " + error.message);
    }
  });
}

export function useDeleteBudgetAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attachment: BudgetAttachment) => {
      // Delete from storage first
      try {
        await deleteFromBucket(BUCKET_NAME, attachment.file_url);
      } catch (e) {
        console.error('Error deleting file from storage:', e);
        // Continue to delete DB record even if storage deletion fails
      }
      
      // Delete record
      const { error } = await supabase
        .from('budget_attachments')
        .delete()
        .eq('id', attachment.id);
      
      if (error) throw error;
    },
    onSuccess: (_, attachment) => {
      queryClient.invalidateQueries({ 
        queryKey: ['budget-attachments', attachment.budget_item_id] 
      });
      toast.success("Archivo eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar archivo: " + error.message);
    }
  });
}

export async function getBudgetAttachmentSignedUrl(relativePath: string): Promise<string> {
  const { url } = await getSignedUrl({ 
    bucket: BUCKET_NAME, 
    path: relativePath 
  });
  return url;
}

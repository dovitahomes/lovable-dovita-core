import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadDocumentParams {
  userId: string;
  file: File;
  category: string;
  notes?: string;
}

export function useUploadUserDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, file, category, notes }: UploadDocumentParams) => {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);
      
      // Insert record in database
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: category,
          notes: notes,
        });
      
      if (dbError) throw dbError;
      
      return { fileName, url: urlData.publicUrl };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', variables.userId] });
      toast.success('Documento subido exitosamente');
    },
    onError: (error) => {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    },
  });
}

export function useDeleteUserDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, userId, filePath }: { documentId: string; userId: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-documents')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId);
      
      if (dbError) throw dbError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', variables.userId] });
      toast.success('Documento eliminado');
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar el documento');
    },
  });
}

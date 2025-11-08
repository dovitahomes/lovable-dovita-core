import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadToBucket, deleteFromBucket } from '@/lib/storage/storage-helpers';

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
      // Upload to storage with standardized path
      const { path } = await uploadToBucket({
        bucket: 'documentos',
        projectId: userId, // Use userId as projectId for user documents
        file,
        filename: file.name
      });
      
      // Insert record in database (store only path)
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_url: path, // Store path, not URL
          file_type: file.type,
          file_size: file.size,
          category: category,
          notes: notes,
        });
      
      if (dbError) {
        // Cleanup uploaded file if DB insert fails
        await deleteFromBucket('documentos', path);
        throw dbError;
      }
      
      return { fileName: file.name, path };
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
      await deleteFromBucket('documentos', filePath);
      
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

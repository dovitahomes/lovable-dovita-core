import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface DocumentFilters {
  search?: string;
  visibility?: string;
  folderType?: string;
}

export function useProjectDocuments(projectId: string, filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ['project-documents', projectId, filters],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (filters.folderType && filters.folderType !== 'all') {
        query = query.eq('tipo_carpeta', filters.folderType);
      }
      
      if (filters.visibility && filters.visibility !== 'all') {
        query = query.eq('visibilidad', filters.visibility);
      }
      
      if (filters.search) {
        query = query.ilike('nombre', `%${filters.search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIG.active,
  });
}

export function useUploadProjectDocuments(projectId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      files, 
      tipo_carpeta, 
      visibilidad = 'interno',
      etiqueta 
    }: { 
      files: File[]; 
      tipo_carpeta: string; 
      visibilidad?: 'interno' | 'cliente' | 'admin';
      etiqueta?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const results = [];

      for (const file of files) {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${projectId}/${sanitizedName}_${timestamp}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('project_docs')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Error al subir ${file.name}: ${uploadError.message}`);
        }

        // Insert document record
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            project_id: projectId,
            nombre: file.name,
            tipo_carpeta,
            etiqueta: etiqueta || null,
            visibilidad,
            file_url: filePath, // Store path, not full URL
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id,
            metadata: {
              uploader_email: user.email,
              original_filename: file.name
            }
          });

        if (insertError) {
          // Clean up uploaded file if DB insert fails
          await supabase.storage.from('project_docs').remove([filePath]);
          throw new Error(`Error al registrar ${file.name}: ${insertError.message}`);
        }

        results.push({ name: file.name, path: filePath });
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success(`${results.length} documento(s) subido(s) exitosamente`);
    },
    onError: (error: any) => {
      toast.error("Error al subir documentos: " + error.message);
    }
  });
}

export function useSignedUrl(filePath: string | null) {
  return useQuery({
    queryKey: ['signed-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;
      
      const { data, error } = await supabase.storage
        .from('project_docs')
        .createSignedUrl(filePath, 600); // 10 minutes
      
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      projectId,
      updates 
    }: { 
      id: string; 
      projectId: string;
      updates: { visibilidad?: string; tipo_carpeta?: string; etiqueta?: string } 
    }) => {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', variables.projectId] });
      toast.success("Documento actualizado");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar: " + error.message);
    }
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      projectId,
      filePath 
    }: { 
      id: string; 
      projectId: string;
      filePath: string 
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project_docs')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue even if storage delete fails
      }

      // Delete record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', variables.projectId] });
      toast.success("Documento eliminado");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar: " + error.message);
    }
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage-helpers";
import { toast } from "sonner";

interface ChecklistUploadParams {
  projectId: string;
  requiredDocId: string;
  file: File;
  etiqueta?: string;
  visibilidad: 'interno' | 'cliente';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
];

export function useChecklistDocumentUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      requiredDocId, 
      file, 
      etiqueta, 
      visibilidad 
    }: ChecklistUploadParams) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("El archivo excede el tamaño máximo de 10 MB");
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Tipo de archivo no permitido");
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Upload to storage
      const { path } = await uploadToBucket({
        bucket: "project_docs",
        projectId,
        file,
        filename: file.name
      });

      // Insert document record
      const { data: docData, error: insertError } = await supabase
        .from("documents")
        .insert({
          project_id: projectId,
          nombre: file.name,
          file_url: path,
          file_type: file.type,
          file_size: file.size,
          tipo_carpeta: "checklist",
          etiqueta: etiqueta || null,
          visibilidad,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        // Cleanup: delete uploaded file if DB insert fails
        await deleteFromBucket("project_docs", path);
        throw insertError;
      }

      // Update required_documents with document_id
      const { error: updateError } = await supabase
        .from("required_documents")
        .update({
          subido: true,
          document_id: docData.id,
          fecha_subida: new Date().toISOString(),
        })
        .eq("id", requiredDocId);

      if (updateError) throw updateError;

      return { fileName: file.name, documentId: docData.id };
    },
    onSuccess: (data) => {
      toast.success(`Documento "${data.fileName}" subido y asociado al checklist`);
      queryClient.invalidateQueries({ queryKey: ["required-documents"] });
      queryClient.invalidateQueries({ queryKey: ["project-documents"] });
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al subir el documento");
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage/storage-helpers";
import { toast } from "sonner";

interface UploadParams {
  projectId: string;
  file: File;
  category?: string;
  onProgress?: (progress: number) => void;
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

export function useClientDocumentsUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, file, category }: UploadParams) => {
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

      // Upload to storage with standardized path (always project_docs for client uploads)
      const { path } = await uploadToBucket({
        bucket: "project_docs",
        projectId,
        file,
        filename: file.name
      });

      // Insert document record
      const { error: insertError } = await supabase.from("documents").insert({
        project_id: projectId,
        nombre: file.name,
        file_url: path, // Store only the path
        file_type: file.type,
        file_size: file.size,
        tipo_carpeta: category || "general",
        etiqueta: category,
        visibilidad: "cliente",
        uploaded_by: user.id,
      });

      if (insertError) {
        // Cleanup: delete uploaded file if DB insert fails
        await deleteFromBucket("project_docs", path);
        throw insertError;
      }

      return { fileName: file.name };
    },
    onSuccess: (data) => {
      toast.success(`${data.fileName} subido correctamente`);
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al subir el archivo");
    },
  });
}

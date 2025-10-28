import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      // Generate file path
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const fileExt = file.name.split(".").pop();
      const uuid = crypto.randomUUID();
      const fileName = `${uuid}-${file.name}`;
      const filePath = `${projectId}/${yearMonth}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("project_docs")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("project_docs").getPublicUrl(filePath);

      // Insert document record
      const { error: insertError } = await supabase.from("documents").insert({
        project_id: projectId,
        nombre: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        tipo_carpeta: category || "general",
        etiqueta: category,
        visibilidad: "cliente",
        uploaded_by: user.id,
      });

      if (insertError) {
        // Cleanup: delete uploaded file if DB insert fails
        await supabase.storage.from("project_docs").remove([filePath]);
        throw insertError;
      }

      return { fileName: file.name, url: publicUrl };
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

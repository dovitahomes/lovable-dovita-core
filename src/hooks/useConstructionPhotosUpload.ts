import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage-helpers";
import { toast } from "sonner";

interface UploadParams {
  projectId: string;
  file: File;
  description?: string;
  visibilidad: 'interno' | 'cliente';
  categoria?: string;
  stageId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

export function useConstructionPhotosUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, file, description, visibilidad, categoria, stageId, latitude, longitude }: UploadParams) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("La imagen excede el tamaño máximo de 10 MB");
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Solo se permiten imágenes (JPEG, PNG, WEBP)");
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Upload to storage with standardized path (projectId/YYYY/MM/uuid.ext)
      const { path } = await uploadToBucket({
        bucket: "project_photos",
        projectId,
        file,
        filename: file.name
      });

      // Insert photo record
      const { error: insertError } = await supabase.from("construction_photos").insert({
        project_id: projectId,
        file_url: path, // Store only the path
        file_name: file.name,
        descripcion: description || null,
        visibilidad,
        categoria: categoria || 'otros',
        stage_id: stageId || null,
        latitude,
        longitude,
        fecha_foto: new Date().toISOString(),
        uploaded_by: user.id,
        is_active: true,
      });

      if (insertError) {
        // Cleanup: delete uploaded file if DB insert fails
        await deleteFromBucket("project_photos", path);
        throw insertError;
      }

      return { fileName: file.name };
    },
    onSuccess: (data) => {
      toast.success(`Foto "${data.fileName}" subida correctamente`);
      queryClient.invalidateQueries({ queryKey: ["construction-photos"] });
      queryClient.invalidateQueries({ queryKey: ["client-photos"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al subir la foto");
    },
  });
}

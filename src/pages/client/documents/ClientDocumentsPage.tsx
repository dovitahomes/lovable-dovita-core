import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RequiredChecklist } from "./components/RequiredChecklist";
import { UploadDropzone } from "./components/UploadDropzone";
import { DocumentList } from "./components/DocumentList";
import { PreviewModal } from "./components/PreviewModal";
import { useRequiredDocuments } from "@/hooks/useRequiredDocuments";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";

interface Document {
  id: string;
  nombre: string;
  file_type?: string | null;
  file_size?: number | null;
  file_url: string;
  created_at: string;
  uploaded_by?: string | null;
  etiqueta?: string | null;
}

export default function ClientDocumentsPage() {
  const { projectId } = useOutletContext<{ projectId: string | null }>();
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const queryClient = useQueryClient();

  // Fetch required documents from business rules
  const { data: requiredDocs = [], isLoading: loadingRequired } =
    useRequiredDocuments(projectId);

  // Fetch client documents
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["client-documents", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("id, nombre, file_type, file_size, file_url, created_at, uploaded_by, etiqueta")
        .eq("project_id", projectId)
        .eq("visibilidad", "cliente")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!projectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento eliminado");
      queryClient.invalidateQueries({ queryKey: ["client-documents"] });
    },
    onError: () => {
      toast.error("Error al eliminar el documento");
    },
  });

  if (!projectId) {
    return (
      <div className="space-y-6 pb-4">
        <div className="text-center py-12">
          <p className="text-slate-600">
            Selecciona un proyecto para ver los documentos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
        <p className="text-slate-600">
          Sube y gestiona los documentos de tu proyecto
        </p>
      </div>

      {/* Required checklist */}
      <RequiredChecklist
        required={requiredDocs}
        documents={documents}
        isLoading={loadingRequired}
      />

      {/* Upload zone */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Subir Documentos
        </h2>
        <UploadDropzone projectId={projectId} />
      </div>

      {/* Document list */}
      {loadingDocs ? (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : (
        <DocumentList
          documents={documents}
          onView={setPreviewDoc}
          onDelete={(docId) => deleteMutation.mutate(docId)}
        />
      )}

      {/* Preview modal */}
      <PreviewModal
        document={previewDoc}
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}

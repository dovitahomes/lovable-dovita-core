import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RequiredDocument {
  id: string;
  project_id: string;
  fase: 'arquitectonico' | 'ejecutivo' | 'construccion';
  documento_tipo: string;
  obligatorio: boolean;
  subido: boolean;
  document_id: string | null;
  fecha_subida: string | null;
  created_at: string;
  updated_at: string;
}

export function useRequiredDocuments(projectId: string | null) {
  return useQuery({
    queryKey: ["required-documents", projectId],
    queryFn: async (): Promise<RequiredDocument[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("required_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("fase", { ascending: true })
        .order("documento_tipo", { ascending: true });

      if (error) throw error;
      return data as RequiredDocument[];
    },
    enabled: !!projectId,
  });
}

export function useMarkDocumentUploaded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      document_id,
    }: {
      id: string;
      document_id: string;
    }) => {
      const { data, error } = await supabase
        .from("required_documents")
        .update({
          subido: true,
          document_id,
          fecha_subida: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["required-documents", data.project_id],
      });
      toast({ description: "Documento marcado como subido" });
    },
    onError: (error) => {
      console.error("Error marking document:", error);
      toast({
        variant: "destructive",
        description: "Error al marcar documento como subido",
      });
    },
  });
}

export function useUnmarkDocumentUploaded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("required_documents")
        .update({
          subido: false,
          document_id: null,
          fecha_subida: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["required-documents", data.project_id],
      });
      toast({ description: "Documento desmarcado" });
    },
    onError: (error) => {
      console.error("Error unmarking document:", error);
      toast({
        variant: "destructive",
        description: "Error al desmarcar documento",
      });
    },
  });
}

export function useAddRequiredDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: Omit<RequiredDocument, "id" | "created_at" | "updated_at" | "subido" | "document_id" | "fecha_subida">) => {
      const { data, error } = await supabase
        .from("required_documents")
        .insert(doc)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["required-documents", data.project_id],
      });
      toast({ description: "Documento requerido agregado" });
    },
    onError: (error) => {
      console.error("Error adding required document:", error);
      toast({
        variant: "destructive",
        description: "Error al agregar documento requerido",
      });
    },
  });
}

export function useDeleteRequiredDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("required_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: ["required-documents", projectId],
      });
      toast({ description: "Documento requerido eliminado" });
    },
    onError: (error) => {
      console.error("Error deleting required document:", error);
      toast({
        variant: "destructive",
        description: "Error al eliminar documento requerido",
      });
    },
  });
}

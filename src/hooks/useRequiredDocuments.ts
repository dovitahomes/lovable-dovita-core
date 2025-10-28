import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RequiredDoc {
  name: string;
  category: string;
  stage?: "arq" | "ejec";
}

export function useRequiredDocuments(projectId: string | null) {
  return useQuery({
    queryKey: ["required-documents", projectId],
    queryFn: async (): Promise<RequiredDoc[]> => {
      if (!projectId) return [];

      // Get required docs from business rules
      const { data: arqDocs } = await supabase.rpc("get_effective_rule", {
        p_key: "docs.required_list.arq",
        p_proyecto_id: projectId,
      });

      const { data: ejecDocs } = await supabase.rpc("get_effective_rule", {
        p_key: "docs.required_list.ejec",
        p_proyecto_id: projectId,
      });

      const required: RequiredDoc[] = [];

      // Parse architecture docs
      if (arqDocs && Array.isArray(arqDocs)) {
        arqDocs.forEach((doc: string | { name: string; category?: string }) => {
          if (typeof doc === "string") {
            required.push({ name: doc, category: doc, stage: "arq" });
          } else {
            required.push({
              name: doc.name,
              category: doc.category || doc.name,
              stage: "arq",
            });
          }
        });
      }

      // Parse execution docs
      if (ejecDocs && Array.isArray(ejecDocs)) {
        ejecDocs.forEach((doc: string | { name: string; category?: string }) => {
          if (typeof doc === "string") {
            required.push({ name: doc, category: doc, stage: "ejec" });
          } else {
            required.push({
              name: doc.name,
              category: doc.category || doc.name,
              stage: "ejec",
            });
          }
        });
      }

      return required;
    },
    enabled: !!projectId,
  });
}

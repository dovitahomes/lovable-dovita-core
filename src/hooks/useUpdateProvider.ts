import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProviderFormData } from "./useCreateProvider";

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProviderFormData }) => {
      const { data: result, error } = await supabase
        .from("providers")
        .update({
          name: data.name,
          code_short: data.code_short,
          contacto_json: data.contacto_json || null,
          fiscales_json: data.fiscales_json || null,
          terms_json: data.terms_json || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Proveedor actualizado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error updating provider:", error);
      toast.error("Error al actualizar proveedor: " + error.message);
    },
  });
}

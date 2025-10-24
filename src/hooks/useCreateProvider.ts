import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const providerSchema = z.object({
  name: z.string().trim().min(1, "Nombre es requerido").max(255),
  code_short: z.string().trim().min(1, "Alias es requerido").max(50),
  contacto_json: z.any().optional(),
  fiscales_json: z.any().optional(),
  terms_json: z.any().optional(),
});

export type ProviderFormData = z.infer<typeof providerSchema>;

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProviderFormData) => {
      const validated = providerSchema.parse(data);
      
      const { data: result, error } = await supabase
        .from("providers")
        .insert({
          name: validated.name,
          code_short: validated.code_short,
          contacto_json: validated.contacto_json || null,
          fiscales_json: validated.fiscales_json || null,
          terms_json: validated.terms_json || null,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Proveedor creado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating provider:", error);
      toast.error("Error al crear proveedor: " + error.message);
    },
  });
}

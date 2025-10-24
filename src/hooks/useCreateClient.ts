import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Nombre es requerido").max(255),
  person_type: z.enum(["fisica", "moral"]),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  address_json: z.any().optional(),
  fiscal_json: z.any().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      const validated = clientSchema.parse(data);
      
      const { data: result, error } = await supabase
        .from("clients")
        .insert({
          name: validated.name,
          person_type: validated.person_type,
          email: validated.email || null,
          phone: validated.phone || null,
          address_json: validated.address_json || null,
          fiscal_json: validated.fiscal_json || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating client:", error);
      toast.error("Error al crear cliente: " + error.message);
    },
  });
}

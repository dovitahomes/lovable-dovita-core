import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const bankSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre es requerido").max(255),
  codigo: z.string().trim().max(10).optional(),
});

export type BankFormData = z.infer<typeof bankSchema>;

export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BankFormData) => {
      const validated = bankSchema.parse(data);
      
      const { data: result, error } = await supabase
        .from("banks")
        .insert({
          nombre: validated.nombre,
          codigo: validated.codigo || null,
          activo: true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Banco creado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating bank:", error);
      toast.error("Error al crear banco: " + error.message);
    },
  });
}

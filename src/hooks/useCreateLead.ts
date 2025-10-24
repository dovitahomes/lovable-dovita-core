import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const leadSchema = z.object({
  nombre_completo: z.string().trim().min(1, "Nombre es requerido").max(255),
  telefono: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  terreno_m2: z.number().positive("Debe ser positivo").optional(),
  presupuesto_referencia: z.number().positive("Debe ser positivo").optional(),
  notas: z.string().max(1000).optional(),
  sucursal_id: z.string().uuid().nullable().optional(),
  origen_lead: z.array(z.string()).optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LeadFormData) => {
      const validated = leadSchema.parse(data);
      
      const { data: result, error } = await supabase
        .from("leads")
        .insert({
          nombre_completo: validated.nombre_completo,
          telefono: validated.telefono || null,
          email: validated.email || null,
          terreno_m2: validated.terreno_m2 || null,
          presupuesto_referencia: validated.presupuesto_referencia || null,
          notas: validated.notas || null,
          sucursal_id: validated.sucursal_id || null,
          origen_lead: validated.origen_lead || null,
          status: "nuevo",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead creado exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating lead:", error);
      toast.error("Error al crear lead: " + error.message);
    },
  });
}

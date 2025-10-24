import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const bankAccountSchema = z.object({
  bank_id: z.string().uuid("Banco es requerido"),
  numero_cuenta: z.string().trim().min(1, "Número de cuenta es requerido").max(50),
  tipo_cuenta: z.string().trim().max(50).optional(),
  moneda: z.enum(["MXN", "USD"]).default("MXN"),
  saldo_actual: z.number().default(0),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      const validated = bankAccountSchema.parse(data);
      
      const { data: result, error } = await supabase
        .from("bank_accounts")
        .insert({
          bank_id: validated.bank_id,
          numero_cuenta: validated.numero_cuenta,
          tipo_cuenta: validated.tipo_cuenta || null,
          moneda: validated.moneda,
          saldo_actual: validated.saldo_actual,
          activa: true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Cuenta bancaria creada exitosamente");
    },
    onError: (error: any) => {
      console.error("Error creating bank account:", error);
      toast.error("Error al crear cuenta: " + error.message);
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useHardDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ [HARD DELETE] Starting validation for provider:", id);
      
      // Step 1: Get provider code_short for validation
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("code_short")
        .eq("id", id)
        .single();

      if (providerError) throw providerError;
      
      console.log("✅ [HARD DELETE] Provider found:", provider.code_short);

      // Step 2: Check if provider is used in budget_items
      const { data: budgetItems, error: budgetError } = await supabase
        .from("budget_items")
        .select("id")
        .eq("proveedor_alias", provider.code_short)
        .limit(1);

      if (budgetError && budgetError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        throw budgetError;
      }

      if (budgetItems && budgetItems.length > 0) {
        console.log("❌ [HARD DELETE] Provider is in use in budget_items:", budgetItems.length);
        throw new Error(
          "No se puede eliminar porque el proveedor está siendo usado en presupuestos. Desactívalo en su lugar."
        );
      }
      
      console.log("✅ [HARD DELETE] Provider not in use, proceeding with delete");

      // Step 3: All validations passed, proceed with hard delete
      const { error: deleteError } = await supabase
        .from("providers")
        .delete()
        .eq("id", id);

      if (deleteError) {
        // Check if it's a foreign key constraint error (fallback)
        if (deleteError.code === '23503') {
          throw new Error(
            "No se puede eliminar porque el proveedor está siendo usado en órdenes de compra u otros registros. Desactívalo en su lugar."
          );
        }
        throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Proveedor eliminado permanentemente");
    },
    onError: (error: Error) => {
      console.error("Error deleting provider:", error);
      toast.error(error.message || "Error al eliminar proveedor");
    },
  });
}

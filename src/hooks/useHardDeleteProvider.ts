import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useHardDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Perform hard delete directly
      // Note: Database foreign keys should prevent deletion if in use
      const { error } = await supabase
        .from("providers")
        .delete()
        .eq("id", id);

      if (error) {
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          throw new Error(
            "No se puede eliminar porque el proveedor está siendo usado en presupuestos u órdenes de compra. Desactívalo en su lugar."
          );
        }
        throw error;
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

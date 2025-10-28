import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientFinancialSummary(projectId: string | null) {
  return useQuery({
    queryKey: ["client-financial-summary", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get project to find client_id
      const { data: project } = await supabase
        .from("projects")
        .select("client_id")
        .eq("id", projectId)
        .single();

      if (!project) return null;

      // Get invoices for this client
      const { data: invoices } = await supabase
        .from("invoices")
        .select("tipo, total_amount, paid")
        .eq("receptor_id", project.client_id);

      // Calculate totals
      const depositos = invoices
        ?.filter(inv => inv.tipo === "ingreso")
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      const egresos = invoices
        ?.filter(inv => inv.tipo === "egreso")
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      return {
        depositos,
        egresos,
        saldo: depositos - egresos,
      };
    },
    enabled: !!projectId,
  });
}

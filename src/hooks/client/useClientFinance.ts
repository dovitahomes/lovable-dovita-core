import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientFinance(projectId: string | null) {
  return useQuery({
    queryKey: ["client-finance", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data: project } = await supabase
        .from("projects")
        .select("client_id")
        .eq("id", projectId)
        .single();

      if (!project) return null;

      const { data: invoices } = await supabase
        .from("invoices")
        .select("tipo, total_amount")
        .eq("receptor_id", project.client_id);

      const depositos = invoices
        ?.filter((inv) => inv.tipo === "ingreso")
        .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      const egresos = invoices
        ?.filter((inv) => inv.tipo === "egreso")
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

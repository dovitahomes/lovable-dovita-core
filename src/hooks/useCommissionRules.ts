import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CommissionRule {
  id: string;
  name: string;
  project_type: string | null;
  product: string | null;
  percent: number;
  applies_on: 'cierre' | 'pago';
  active: boolean;
  alianza_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCommissionRules() {
  return useQuery({
    queryKey: ["commission-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CommissionRule[];
    },
  });
}

export function useUpsertCommissionRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<CommissionRule>) => {
      const { data, error } = await (supabase
        .from("commission_rules")
        .upsert([rule] as any)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
      toast({
        title: "Éxito",
        description: "Regla de comisión guardada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCommissionRule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commission_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-rules"] });
      toast({
        title: "Éxito",
        description: "Regla eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCommissionSummary() {
  return useQuery({
    queryKey: ["commission-summary"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_commission_summary")
        .select("*");

      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        project_id: string;
        client_id: string;
        client_name: string;
        sujeto_id: string;
        collaborator_name: string;
        tipo: string;
        percent: number;
        base_amount: number;
        commission_amount: number;
        status: string;
        notes: string;
        created_at: string;
        paid_at: string;
      }>;
    },
  });
}
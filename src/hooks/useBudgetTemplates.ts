import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBudgetTemplates(type: 'parametrico' | 'ejecutivo') {
  return useQuery({
    queryKey: ['budget_templates', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBudgetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      type,
      items,
    }: {
      name: string;
      description?: string;
      type: 'parametrico' | 'ejecutivo';
      items: any[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from('budget_templates')
        .insert({
          name,
          description: description || null,
          type,
          items: items,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_templates'] });
      toast.success("Template guardado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al guardar template: " + error.message);
    },
  });
}

export function useDeleteBudgetTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('budget_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_templates'] });
      toast.success("Template eliminado");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar: " + error.message);
    },
  });
}

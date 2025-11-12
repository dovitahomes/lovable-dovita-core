import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LeadNote {
  id: string;
  description: string;
  performed_by: string;
  created_at: string;
  performer?: {
    full_name: string;
    avatar_url?: string;
  };
}

export function useLeadNotes(leadId: string) {
  return useQuery({
    queryKey: ['lead-notes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_activities')
        .select(`
          id,
          description,
          performed_by,
          created_at
        `)
        .eq('entity_type', 'lead')
        .eq('entity_id', leadId)
        .eq('activity_type', 'note_added')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Obtener información de los usuarios por separado
      const userIds = [...new Set(data.map(note => note.performed_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(note => ({
        ...note,
        performer: profilesMap.get(note.performed_by) || undefined
      })) as LeadNote[];
    },
    enabled: !!leadId,
  });
}

export function useAddLeadNote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, note }: { leadId: string; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: 'note_added',
          entity_type: 'lead',
          entity_id: leadId,
          description: note,
          performed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      toast({
        title: "Nota guardada",
        description: "La nota se agregó correctamente al historial",
      });
    },
    onError: (error) => {
      console.error('Error al guardar nota:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive",
      });
    },
  });
}

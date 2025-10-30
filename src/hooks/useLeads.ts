import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export type LeadStatus = "nuevo" | "contactado" | "calificado" | "convertido" | "perdido";

export function useLeadsByStatus(status: LeadStatus, search: string = "") {
  return useQuery({
    queryKey: ['leads', status, search],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, sucursales(nombre)')
        .eq('status', status)
        .order('updated_at', { ascending: false });
      
      if (search) {
        query = query.or(`nombre_completo.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIG.active,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: any) => {
      toast.error("Error al actualizar estado: " + error.message);
    }
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadId, 
      lead, 
      personType,
      clientName,
      clientEmail,
      clientPhone,
      sucursalId,
      projects 
    }: { 
      leadId: string;
      lead: any;
      personType: 'fisica' | 'moral';
      clientName: string;
      clientEmail?: string;
      clientPhone?: string;
      sucursalId?: string;
      projects: Array<{
        terreno_m2?: number;
        ubicacion_json?: any;
        notas?: string;
      }>;
    }) => {
      // 1. Crear cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          person_type: personType,
          name: clientName,
          email: clientEmail || lead.email,
          phone: clientPhone || lead.telefono,
          address_json: {
            direccion: lead.direccion,
            estado: lead.estado
          }
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Crear proyectos
      const projectsToCreate = projects.map(p => ({
        client_id: client.id,
        sucursal_id: sucursalId || lead.sucursal_id || null,
        status: 'activo' as const,
        terreno_m2: p.terreno_m2 || null,
        ubicacion_json: p.ubicacion_json || lead.ubicacion_terreno_json || {},
        notas: p.notas || null
      }));

      const { data: createdProjects, error: projectsError } = await supabase
        .from('projects')
        .insert(projectsToCreate)
        .select();

      if (projectsError) throw projectsError;

      // 3. Actualizar lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'convertido',
          client_id: client.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      return { client, projects: createdProjects };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Lead convertido exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al convertir lead: " + error.message);
    }
  });
}

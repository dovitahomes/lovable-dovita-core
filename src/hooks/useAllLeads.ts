import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { LeadStatus } from "./useLeads";

export interface LeadWithActivity {
  id: string;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  terreno_m2?: number;
  presupuesto_referencia?: number;
  status: LeadStatus;
  sucursal_id?: string;
  origen_lead?: string[];
  client_id?: string;
  created_at: string;
  updated_at: string;
  last_activity?: string;
  sucursales?: {
    nombre: string;
  };
}

interface UseAllLeadsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useAllLeads({
  search = "",
  page = 1,
  pageSize = 20,
  sortBy = "updated_at",
  sortOrder = "desc"
}: UseAllLeadsParams = {}) {
  return useQuery({
    queryKey: ['all-leads', search, page, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      // First, get all leads
      let query = supabase
        .from('leads')
        .select('*, sucursales(nombre)', { count: 'exact' });
      
      // Apply search filter
      if (search) {
        query = query.or(`nombre_completo.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data: leads, error, count } = await query;
      if (error) throw error;

      // For each lead, get the last activity
      const leadsWithActivity = await Promise.all(
        (leads || []).map(async (lead) => {
          const { data: activities } = await supabase
            .from('crm_activities')
            .select('created_at')
            .eq('entity_type', 'lead')
            .eq('entity_id', lead.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          return {
            ...lead,
            last_activity: activities?.[0]?.created_at || null,
          } as LeadWithActivity;
        })
      );

      return {
        data: leadsWithActivity,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    ...CACHE_CONFIG.active,
  });
}

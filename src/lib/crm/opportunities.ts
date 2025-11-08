/**
 * Capa de datos para Opportunities (Oportunidades CRM)
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { ensureValidSession, handleSupabaseError } from "./session";

type OpportunityRow = Database['public']['Tables']['opportunities']['Row'];
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];
type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update'];

export interface ListOpportunitiesParams {
  q?: string;
  accountId?: string;
  stage?: string;
  page?: number;
  pageSize?: number;
}

export interface OpportunityWithRelations extends OpportunityRow {
  accounts?: { name: string } | null;
  units_count?: number;
}

export async function listOpportunities(params: ListOpportunitiesParams = {}) {
  try {
    await ensureValidSession();
    
    const { q = '', accountId, stage, page = 0, pageSize = 50 } = params;
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('opportunities')
      .select('*, accounts(name)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(start, end);

    if (q) {
      query = query.or(`name.ilike.%${q}%,folio.ilike.%${q}%`);
    }

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    const { data, error, count } = await query;

    if (error) {
      throw handleSupabaseError(error, "Error al cargar oportunidades");
    }

    return { 
      data: (data || []) as OpportunityWithRelations[], 
      count: count || 0 
    };
  } catch (error) {
    console.error("Error in listOpportunities:", error);
    throw error;
  }
}

export async function getOpportunity(id: string) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, accounts(name), opportunity_units(unit_id, units(name, status))')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al cargar la oportunidad");
    }

    return data;
  } catch (error) {
    console.error("Error in getOpportunity:", error);
    throw error;
  }
}

export async function createOpportunity(payload: Omit<OpportunityInsert, 'folio'>) {
  try {
    const userId = await ensureValidSession();

    // El folio es obligatorio en Insert según types - usar temp y confiar en trigger
    const { data, error } = await supabase
      .from('opportunities')
      .insert([{
        ...payload,
        folio: 'TEMP', // Será reemplazado por el trigger
        created_by: userId || undefined,
      }])
      .select('*, accounts(name)')
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al crear la oportunidad");
    }

    if (!data?.folio || data.folio === 'TEMP') {
      console.warn("Opportunity created without proper folio:", data);
    }

    return data as OpportunityWithRelations;
  } catch (error) {
    console.error("Error in createOpportunity:", error);
    throw error;
  }
}

export async function updateOpportunity(id: string, payload: OpportunityUpdate) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('opportunities')
      .update(payload)
      .eq('id', id)
      .select('*, accounts(name)')
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al actualizar la oportunidad");
    }

    return data as OpportunityWithRelations;
  } catch (error) {
    console.error("Error in updateOpportunity:", error);
    throw error;
  }
}

export async function deleteOpportunity(id: string) {
  try {
    await ensureValidSession();

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error, "Error al eliminar la oportunidad");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteOpportunity:", error);
    throw error;
  }
}

export async function linkUnitToOpportunity(opportunityId: string, unitId: string) {
  try {
    await ensureValidSession();

    const { error } = await supabase
      .from('opportunity_units')
      .insert({ opportunity_id: opportunityId, unit_id: unitId });

    if (error) {
      throw handleSupabaseError(error, "Error al vincular unidad");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in linkUnitToOpportunity:", error);
    throw error;
  }
}

export async function unlinkUnitFromOpportunity(opportunityId: string, unitId: string) {
  try {
    await ensureValidSession();

    const { error } = await supabase
      .from('opportunity_units')
      .delete()
      .eq('opportunity_id', opportunityId)
      .eq('unit_id', unitId);

    if (error) {
      throw handleSupabaseError(error, "Error al desvincular unidad");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in unlinkUnitFromOpportunity:", error);
    throw error;
  }
}

/**
 * Promocionar un Lead a Opportunity (preparado para futuro)
 */
export async function promoteLeadToOpportunity(leadId: string, payload: Partial<OpportunityInsert>) {
  try {
    const userId = await ensureValidSession();

    // 1. Obtener datos del lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError) {
      throw handleSupabaseError(leadError, "Error al obtener lead");
    }

    // 2. Crear oportunidad con datos del lead
    const opportunityData: Omit<OpportunityInsert, 'folio'> = {
      name: payload.name || `Oportunidad - ${lead.nombre_completo || 'Sin nombre'}`,
      account_id: payload.account_id!,
      amount: payload.amount || lead.presupuesto_referencia || null,
      probability: payload.probability || 50,
      stage: payload.stage || 'prospecto',
      expected_close_date: payload.expected_close_date,
      notes: payload.notes || lead.notas,
      created_by: userId || undefined,
    };

    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert([{
        ...opportunityData,
        folio: 'TEMP' // Será reemplazado por el trigger
      }])
      .select('*')
      .single();

    if (oppError) {
      throw handleSupabaseError(oppError, "Error al crear oportunidad");
    }

    // 3. Actualizar lead a estado "convertido"
    await supabase
      .from('leads')
      .update({ status: 'convertido' })
      .eq('id', leadId);

    return opportunity as OpportunityRow;
  } catch (error) {
    console.error("Error in promoteLeadToOpportunity:", error);
    throw error;
  }
}

/**
 * Capa de datos para Accounts (Cuentas CRM)
 * Maneja todas las operaciones CRUD con tipos estrictos y sesión validada
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { ensureValidSession, handleSupabaseError } from "./session";

type AccountRow = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

export interface ListAccountsParams {
  q?: string;
  accountType?: string;
  page?: number;
  pageSize?: number;
}

export interface AccountWithRelations extends AccountRow {
  sucursales?: { nombre: string } | null;
}

export async function listAccounts(params: ListAccountsParams = {}) {
  try {
    await ensureValidSession();
    
    const { q = '', accountType, page = 0, pageSize = 50 } = params;
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('accounts')
      .select('*, sucursales(nombre)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(start, end);

    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,tax_id.ilike.%${q}%`);
    }

    if (accountType) {
      query = query.eq('account_type', accountType);
    }

    const { data, error, count } = await query;

    if (error) {
      throw handleSupabaseError(error, "Error al cargar cuentas");
    }

    return { data: data as AccountWithRelations[], count: count || 0 };
  } catch (error) {
    console.error("Error in listAccounts:", error);
    throw error;
  }
}

export async function getAccount(id: string) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('accounts')
      .select('*, sucursales(nombre)')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al cargar la cuenta");
    }

    return data as AccountWithRelations;
  } catch (error) {
    console.error("Error in getAccount:", error);
    throw error;
  }
}

export async function createAccount(payload: Omit<AccountInsert, 'created_by'>) {
  try {
    const userId = await ensureValidSession();

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        ...payload,
        created_by: userId,
      })
      .select('*, sucursales(nombre)')
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al crear la cuenta");
    }

    return data as AccountWithRelations;
  } catch (error) {
    console.error("Error in createAccount:", error);
    throw error;
  }
}

export async function updateAccount(id: string, payload: AccountUpdate) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('accounts')
      .update(payload)
      .eq('id', id)
      .select('*, sucursales(nombre)')
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al actualizar la cuenta");
    }

    return data as AccountWithRelations;
  } catch (error) {
    console.error("Error in updateAccount:", error);
    throw error;
  }
}

export async function deleteAccount(id: string) {
  try {
    await ensureValidSession();

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error, "Error al eliminar la cuenta");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    throw error;
  }
}

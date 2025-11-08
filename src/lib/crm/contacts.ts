/**
 * Capa de datos para Contacts (Contactos CRM)
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { ensureValidSession, handleSupabaseError } from "./session";

type ContactRow = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export interface ListContactsParams {
  q?: string;
  accountId?: string;
  page?: number;
  pageSize?: number;
}

export interface ContactWithRelations extends ContactRow {
  accounts?: { name: string } | null;
}

export async function listContacts(params: ListContactsParams = {}) {
  try {
    await ensureValidSession();
    
    const { q = '', accountId, page = 0, pageSize = 50 } = params;
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('contacts')
      .select('*, accounts(name)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(start, end);

    if (q) {
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,mobile.ilike.%${q}%`);
    }

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw handleSupabaseError(error, "Error al cargar contactos");
    }

    return { data: data as ContactWithRelations[], count: count || 0 };
  } catch (error) {
    console.error("Error in listContacts:", error);
    throw error;
  }
}

export async function getContact(id: string) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('contacts')
      .select('*, accounts(name)')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al cargar el contacto");
    }

    return data as ContactWithRelations;
  } catch (error) {
    console.error("Error in getContact:", error);
    throw error;
  }
}

export async function createContact(payload: Omit<ContactInsert, 'created_by'>) {
  try {
    const userId = await ensureValidSession();

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        ...payload,
        created_by: userId,
      })
      .select('*, accounts(name)')
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al crear el contacto");
    }

    return data as ContactWithRelations;
  } catch (error) {
    console.error("Error in createContact:", error);
    throw error;
  }
}

export async function updateContact(id: string, payload: ContactUpdate) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('contacts')
      .update(payload)
      .eq('id', id)
      .select('*, accounts(name)')
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al actualizar el contacto");
    }

    return data as ContactWithRelations;
  } catch (error) {
    console.error("Error in updateContact:", error);
    throw error;
  }
}

export async function deleteContact(id: string) {
  try {
    await ensureValidSession();

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error, "Error al eliminar el contacto");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteContact:", error);
    throw error;
  }
}

/**
 * Capa de datos para Tasks (Tareas CRM)
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { ensureValidSession, handleSupabaseError } from "./session";

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface ListTasksParams {
  q?: string;
  assignedTo?: string;
  status?: string;
  relatedToType?: string;
  relatedToId?: string;
  page?: number;
  pageSize?: number;
}

export interface TaskWithRelations extends TaskRow {
  assigned_user?: { first_name: string; last_name: string } | null;
}

export async function listTasks(params: ListTasksParams = {}) {
  try {
    await ensureValidSession();
    
    const { q = '', assignedTo, status, relatedToType, relatedToId, page = 0, pageSize = 50 } = params;
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(start, end);

    if (q) {
      query = query.or(`subject.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (relatedToType) {
      query = query.eq('related_to_type', relatedToType);
    }

    if (relatedToId) {
      query = query.eq('related_to_id', relatedToId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw handleSupabaseError(error, "Error al cargar tareas");
    }

    return { data: (data || []) as TaskWithRelations[], count: count || 0 };
  } catch (error) {
    console.error("Error in listTasks:", error);
    throw error;
  }
}

export async function getTask(id: string) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al cargar la tarea");
    }

    return data as TaskWithRelations;
  } catch (error) {
    console.error("Error in getTask:", error);
    throw error;
  }
}

export async function createTask(payload: Omit<TaskInsert, 'created_by'>) {
  try {
    const userId = await ensureValidSession();

    // Default status='open' si no se proporciona
    const taskData: TaskInsert = {
      ...payload,
      status: payload.status || 'open',
      created_by: userId || undefined,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al crear la tarea");
    }

    return data as TaskWithRelations;
  } catch (error) {
    console.error("Error in createTask:", error);
    throw error;
  }
}

export async function updateTask(id: string, payload: TaskUpdate) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al actualizar la tarea");
    }

    return data as TaskWithRelations;
  } catch (error) {
    console.error("Error in updateTask:", error);
    throw error;
  }
}

export async function completeTask(id: string) {
  try {
    await ensureValidSession();

    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error, "Error al completar la tarea");
    }

    return data as TaskRow;
  } catch (error) {
    console.error("Error in completeTask:", error);
    throw error;
  }
}

export async function deleteTask(id: string) {
  try {
    await ensureValidSession();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw handleSupabaseError(error, "Error al eliminar la tarea");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteTask:", error);
    throw error;
  }
}

/**
 * Manejo robusto de sesión para operaciones CRM
 * Garantiza que la sesión esté válida antes de cada operación
 */

import { supabase } from "@/integrations/supabase/client";

export async function ensureValidSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      throw new Error("Error de autenticación");
    }

    if (!session) {
      // Intentar refrescar la sesión
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
      }
      
      return refreshedSession.user.id;
    }

    return session.user.id;
  } catch (error) {
    console.error("Session validation failed:", error);
    throw error;
  }
}

export function handleSupabaseError(error: any, defaultMessage: string): Error {
  if (error.code === 'PGRST116' || error.message?.includes('JWT')) {
    return new Error("Sesión expirada. Por favor, recarga la página.");
  }
  
  if (error.code === '42501' || error.message?.includes('permission')) {
    return new Error("No tienes permisos para realizar esta acción.");
  }
  
  if (error.code === '23505') {
    return new Error("Ya existe un registro con estos datos.");
  }
  
  return new Error(error.message || defaultMessage);
}

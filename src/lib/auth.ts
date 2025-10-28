import { supabase } from "@/integrations/supabase/client";

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  return session;
}

/**
 * Get the current user's email
 */
export async function getUserEmail() {
  const session = await getSession();
  return session?.user?.email || null;
}

/**
 * Check if the current user has the 'cliente' role
 * This is a soft check - only logs a warning if not a client
 * Does NOT block UI
 */
export async function requireClientRole() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.warn("[requireClientRole] No user found");
    return false;
  }

  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (error) {
    console.warn("[requireClientRole] Error fetching roles:", error);
    return false;
  }

  const isClient = roles?.some(r => r.role === 'cliente');
  
  if (!isClient) {
    console.warn("[requireClientRole] User is not a client, but UI is not blocked");
  }

  return isClient;
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error);
    return null;
  }
  return user;
}

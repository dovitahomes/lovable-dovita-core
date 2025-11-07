import { supabase } from "@/integrations/supabase/client";

export interface InviteUserData {
  email: string;
  full_name?: string;
  phone?: string;
  role?: 'admin' | 'colaborador' | 'cliente' | 'contador';
  sucursal_id?: string;
  fecha_nacimiento?: string;
}

/**
 * Invites a new user via secure edge function
 */
export async function inviteUser(data: InviteUserData): Promise<{ success: boolean; user_id?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const SUPABASE_URL = "https://bkthkotzicohjizmcmsa.supabase.co";

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/invite-user`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite user');
    }

    const result = await response.json();
    return { success: true, user_id: result.user_id };
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Syncs a user profile using the secure RPC
 */
export async function syncUserProfile(userId: string, email: string, fullName?: string): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('sync_user_profile', {
      p_user_id: userId,
      p_email: email,
      p_full_name: fullName || '',
    });

    if (error) throw error;

    const result = data as any;

    return {
      success: result?.success ?? true,
      action: result?.action ?? 'synced',
    };
  } catch (error: any) {
    console.error('Error syncing profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a password reset email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Health check for Supabase connection
 */
export async function healthCheckSupabase(): Promise<{ 
  connected: boolean; 
  profiles_accessible: boolean;
  error?: string 
}> {
  try {
    // Test basic connectivity by querying profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      return {
        connected: false,
        profiles_accessible: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      profiles_accessible: true,
    };
  } catch (error: any) {
    return {
      connected: false,
      profiles_accessible: false,
      error: error.message,
    };
  }
}

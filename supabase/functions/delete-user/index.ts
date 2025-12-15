import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[delete-user] Starting user deletion request');

    // Get authorization header
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[delete-user] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Bearer header (robust parsing + trimming)
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = (bearerMatch?.[1] ?? authHeader).trim();
    const looksLikeJwt = token.split('.').length === 3;

    console.log('[delete-user] Token extracted:', {
      hasBearerPrefix: !!bearerMatch,
      tokenLength: token.length,
      looksLikeJwt,
    });

    if (!looksLikeJwt) {
      console.error('[delete-user] Invalid authorization header format');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[delete-user] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[delete-user] Creating admin client with service role');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the requesting user using the JWT token directly
    console.log('[delete-user] Verifying JWT token');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('[delete-user] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user] Authenticated user:', requestingUser.id);

    // Verify requesting user is admin
    console.log('[delete-user] Checking if user is admin:', requestingUser.id);
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role_name')
      .eq('user_id', requestingUser.id);

    console.log('[delete-user] User roles:', { roles, roleError });

    if (roleError) {
      console.error('[delete-user] Error fetching roles:', roleError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar permisos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roles?.some(r => r.role_name === 'admin')) {
      console.error('[delete-user] User is not admin. Roles:', roles);
      return new Response(
        JSON.stringify({ error: 'Solo administradores pueden eliminar usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user_id to delete from request body
    const { user_id } = await req.json();

    if (!user_id) {
      console.error('[delete-user] No user_id provided');
      return new Response(
        JSON.stringify({ error: 'user_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user] Deleting user:', user_id);

    // Prevent self-deletion
    if (user_id === requestingUser.id) {
      console.error('[delete-user] Cannot delete yourself');
      return new Response(
        JSON.stringify({ error: 'No puedes eliminar tu propio usuario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from auth.users (this will cascade to user_roles and user_permissions via ON DELETE CASCADE)
    console.log('[delete-user] Calling auth.admin.deleteUser for:', user_id);
    const { data: deleteData, error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteAuthError) {
      console.error('[delete-user] Error deleting from auth.users:', {
        message: deleteAuthError.message,
        status: deleteAuthError.status,
        code: deleteAuthError.code,
        details: deleteAuthError
      });
      return new Response(
        JSON.stringify({ 
          error: `Error al eliminar usuario: ${deleteAuthError.message}`,
          details: deleteAuthError.code || 'DATABASE_ERROR'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user] Auth user deleted successfully:', deleteData);

    // Also delete from profiles table explicitly (in case cascade doesn't work)
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id);

    if (deleteProfileError) {
      console.warn('[delete-user] Error deleting from profiles (may already be cascaded):', deleteProfileError);
      // Don't fail the request since auth.users deletion succeeded
    }

    console.log('[delete-user] ✓ User deleted successfully:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario eliminado exitosamente',
        user_id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-user] Exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

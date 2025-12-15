import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[biometric-login] Starting biometric login request');

    const { userId, credentialId } = await req.json();

    if (!userId || !credentialId) {
      console.error('[biometric-login] Missing userId or credentialId');
      return new Response(
        JSON.stringify({ error: 'userId and credentialId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[biometric-login] Verifying credential for user:', userId);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify credential belongs to user
    const { data: credential, error: credError } = await supabaseAdmin
      .from('user_biometric_credentials')
      .select('user_id')
      .eq('credential_id', credentialId)
      .eq('user_id', userId)
      .single();

    if (credError || !credential) {
      console.error('[biometric-login] Credential not found or mismatch:', credError);
      return new Response(
        JSON.stringify({ error: 'Invalid biometric credential' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[biometric-login] Credential verified, getting user email');

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error('[biometric-login] User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;
    console.log('[biometric-login] Generating magic link for:', userEmail);

    // Generate magic link token
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (linkError || !linkData) {
      console.error('[biometric-login] Failed to generate link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate authentication token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_used_at for the credential
    await supabaseAdmin
      .from('user_biometric_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', credentialId);

    console.log('[biometric-login] Magic link generated successfully');

    // Return the token hash and email for OTP verification
    return new Response(
      JSON.stringify({ 
        token: linkData.properties.hashed_token,
        email: userEmail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[biometric-login] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

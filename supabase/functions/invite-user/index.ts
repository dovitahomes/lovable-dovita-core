import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify caller is authenticated and admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role_name')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role_name === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, full_name, role = 'colaborador', phone, sucursal_id, fecha_nacimiento } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.find(u => u.email === email);

    let userId: string;

    if (userExists) {
      // User already exists, just update roles/permissions
      userId = userExists.id;
      console.log(`User ${email} already exists, updating roles/permissions`);

      // Update or create profile
      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        full_name: full_name || email.split('@')[0],
        phone: phone || null,
      });

      // Update user metadata if needed
      if (sucursal_id || fecha_nacimiento) {
        await supabaseAdmin.from('user_metadata').upsert({
          user_id: userId,
          sucursal_id: sucursal_id || null,
          fecha_nacimiento: fecha_nacimiento || null,
        });
      }

      // Update role (delete old, insert new)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role_name: role,
      });

      // Reseed permissions
      await supabaseAdmin.rpc('seed_role_permissions', {
        p_user_id: userId,
        p_role_name: role,
      });

    } else {
      // Invite new user
      const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: full_name || email.split('@')[0],
        },
      });

      if (inviteError) throw inviteError;

      userId = authData.user.id;

      // Upsert profile (trigger may have already created it)
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        full_name: full_name || email.split('@')[0],
        phone: phone || null,
      }, {
        onConflict: 'id'
      });

      if (profileError) throw profileError;

      // Upsert user metadata if needed
      if (sucursal_id || fecha_nacimiento) {
        await supabaseAdmin.from('user_metadata').upsert({
          user_id: userId,
          sucursal_id: sucursal_id || null,
          fecha_nacimiento: fecha_nacimiento || null,
        }, {
          onConflict: 'user_id'
        });
      }

      // Assign role (use upsert to handle existing role)
      const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({
        user_id: userId,
        role_name: role,
      }, {
        onConflict: 'user_id,role_name'
      });

      if (roleError) throw roleError;

      // Seed permissions for the role
      await supabaseAdmin.rpc('seed_role_permissions', {
        p_user_id: userId,
        p_role_name: role,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'User invited successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error inviting user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

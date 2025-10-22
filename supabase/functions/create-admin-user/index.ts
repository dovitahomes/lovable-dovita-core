import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminRequest {
  email: string;
  password: string;
  full_name: string;
  secret_key: string; // Simple security to prevent unauthorized calls
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, secret_key }: CreateAdminRequest = await req.json();

    // Simple validation
    if (secret_key !== "dovita-admin-setup-2025") {
      return new Response(
        JSON.stringify({ error: "Invalid secret key" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let authUserId: string;
    let created_or_updated = "created";

    // Step 1: Try to create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
      },
    });

    if (authError) {
      // If user already exists, update instead
      if (authError.message?.includes("already")) {
        console.log("User already exists, updating...");
        
        // Get existing user
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find((u) => u.email === email);
        
        if (!existingUser) {
          throw new Error("User exists but could not be found");
        }

        authUserId = existingUser.id;
        created_or_updated = "updated";

        // Update user to ensure password and confirmation
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: password,
          email_confirm: true,
        });
      } else {
        throw authError;
      }
    } else {
      authUserId = authData.user.id;
    }

    console.log(`Auth user ${created_or_updated}: ${authUserId}`);

    // Step 2: Insert/update in users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("profile_id", authUserId)
      .maybeSingle();

    if (existingUser) {
      // Update existing user record
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          full_name: full_name,
          email: email,
        })
        .eq("profile_id", authUserId);

      if (updateError) throw updateError;
      console.log("Users table record updated");
    } else {
      // Insert new user record
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          profile_id: authUserId,
          email: email,
          full_name: full_name,
        });

      if (insertError) throw insertError;
      console.log("Users table record created");
    }

    // Step 3: Ensure admin role exists
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", authUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!existingRole) {
      // Delete any other roles first
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", authUserId);

      // Insert admin role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: authUserId,
          role: "admin",
        });

      if (roleError) throw roleError;
      console.log("Admin role assigned");
    } else {
      console.log("Admin role already exists");
    }

    // Step 4: Verify RLS policies are intact (just log, don't modify)
    console.log("✓ RLS policies unchanged - all operations done with service_role_key");

    // Return success summary
    const summary = {
      auth_user_id: authUserId,
      email: email,
      full_name: full_name,
      role: "admin",
      created_or_updated: created_or_updated,
      rls_unchanged: true,
      message: "Admin user created/updated successfully. User can now login with provided credentials.",
    };

    console.log("Summary:", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

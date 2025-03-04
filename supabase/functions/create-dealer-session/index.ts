
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the admin key
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Handle requests
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse request body
    const { userId, email } = await req.json();
    
    console.log(`Creating session for user: ${userId} with email: ${email || 'not provided'}`);
    
    if (!userId && !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing user ID or email" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    let userData = null;
    let userError = null;

    // If email is provided, look up user by email first
    if (email) {
      console.log(`Looking up user by email: ${email}`);
      
      // Use listUsers with filter for email lookup (available in v2.38.4)
      const { data: usersByEmail, error: emailLookupError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email
        }
      });
      
      if (emailLookupError) {
        console.error("Error looking up user by email:", emailLookupError.message);
      } else if (usersByEmail?.users?.length > 0) {
        console.log("User found by email:", usersByEmail.users[0].id);
        userData = { user: usersByEmail.users[0] };
      } else {
        console.log("No user found with email:", email);
      }
    }

    // If user wasn't found by email or email wasn't provided, try by ID
    if (!userData?.user && userId) {
      console.log("Looking up user by ID:", userId);
      const userByIdResult = await supabaseAdmin.auth.admin.getUserById(userId);
      userData = userByIdResult.data;
      userError = userByIdResult.error;
      
      if (userError) {
        console.error("Error finding user by ID:", userError.message);
      } else if (userData?.user) {
        console.log("User found by ID:", userData.user.id);
      }
    }

    // If we still don't have a user, return an error
    if (!userData?.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userError?.message || "User not found" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    console.log("User found:", userData.user.id, "Email:", userData.user.email);

    // Create a sign-in link for the user (available in v2.38.4)
    // We generate a link but won't actually send it - we just need the session
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email || '',
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL") || ''}/auth/callback`
      }
    });

    if (authError) {
      console.error("Error generating auth link:", authError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    // Use admin powers to directly sign in
    // Note: Using auth, not auth.admin here - this method exists in the base auth namespace
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.user.email || '',
      password: 'admin-bypassed', // This won't be checked with admin powers
    });

    if (sessionError) {
      console.error("Error creating session:", sessionError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: sessionError.message 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log("Session created successfully for user:", sessionData.session.user.id);
    
    // Return the session data
    return new Response(
      JSON.stringify({ 
        success: true, 
        session: sessionData.session
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

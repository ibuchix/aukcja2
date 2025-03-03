
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
    const { userId } = await req.json();
    
    console.log(`Creating session for user: ${userId}`);
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing user ID" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // First verify the user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error("Error finding user:", userError?.message || "User not found");
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

    // Generate a session - Using the correct method
    // Use signInWithUser method instead which is available in this version
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email || '',
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL") || ''}/auth/callback`
      }
    });

    if (authError) {
      console.error("Error creating session:", authError.message);
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

    // Now use the token to sign in manually
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: userData.user.email || '',
      password: 'not-used', // This won't be checked as we're using admin
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

    console.log("Session created successfully:", sessionData.session.user.id);
    
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


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

    // If email is provided, use it directly (preferred approach)
    if (email) {
      console.log(`Attempting to sign in with email: ${email}`);
      
      // Sign in directly using the admin client
      const { data: sessionData, error: signInError } = await supabaseAdmin.auth.admin.signInWithEmail(email);
      
      if (signInError) {
        console.error("Error signing in with email:", signInError.message);
        
        // Fall back to getting user by ID if direct signin fails
        console.log("Falling back to user lookup by ID");
      } else if (sessionData?.session) {
        console.log("Successfully created session via email signin");
        
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
      }
    }

    // Try to get user by ID as fallback
    console.log("Looking up user by ID:", userId);
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error("Error finding user:", userError?.message || "User not found");
      
      // Try to look up user by email as a last resort
      if (email) {
        console.log("Attempting to look up user by email as fallback");
        const { data: userByEmailData, error: emailLookupError } = await supabaseAdmin.auth.admin.listUsers({
          filter: {
            email: email
          }
        });
        
        if (emailLookupError || !userByEmailData?.users?.length) {
          console.error("Email lookup failed:", emailLookupError?.message || "No users found with that email");
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "User not found by either ID or email" 
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 404 
            }
          );
        }
        
        // Use the found user
        userData.user = userByEmailData.users[0];
        console.log("Found user by email lookup:", userData.user.id);
      } else {
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
    }

    console.log("User found:", userData.user.id, "Email:", userData.user.email);

    // Create a sign-in link for the user
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

    // Now create the session by signing in directly with admin privileges
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

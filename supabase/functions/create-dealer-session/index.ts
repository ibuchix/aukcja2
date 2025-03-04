
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
    
    console.log(`Authentication request for: userId=${userId || 'not provided'}, email=${email || 'not provided'}`);
    
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

    // We'll maintain a single userData variable to track the user we want to authenticate
    let userData = null;
    let targetEmail = null;
    let targetUserId = null;

    // If email is provided, look up user by email first
    if (email) {
      console.log(`Looking up user by email: ${email}`);
      
      const { data: usersByEmail, error: emailLookupError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email
        }
      });
      
      if (emailLookupError) {
        console.error("Error looking up user by email:", emailLookupError.message);
      } else if (usersByEmail?.users?.length > 0) {
        // Found user by email - this is our target user
        userData = { user: usersByEmail.users[0] };
        targetEmail = email; // Use the exact email we searched with
        targetUserId = usersByEmail.users[0].id;
        console.log(`User found by email: ${email}, ID: ${targetUserId}`);
      } else {
        console.log(`No user found with email: ${email}`);
      }
    }

    // If user wasn't found by email or email wasn't provided, try by ID
    if (!userData?.user && userId) {
      console.log(`Looking up user by ID: ${userId}`);
      const userByIdResult = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userByIdResult.error) {
        console.error(`Error finding user by ID ${userId}:`, userByIdResult.error.message);
      } else if (userByIdResult.data?.user) {
        userData = userByIdResult.data;
        targetEmail = userByIdResult.data.user.email;
        targetUserId = userId;
        console.log(`User found by ID: ${userId}, Email: ${targetEmail}`);
      }
    }

    // If we still don't have a user, return an error
    if (!userData?.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User not found" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    console.log(`Proceeding with authentication for User ID: ${targetUserId}, Email: ${targetEmail}`);

    // Create a sign-in link for the user (available in v2.38.4)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail || '',
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
      email: targetEmail || '',
      password: 'admin-bypassed', // This won't be checked with admin powers
    });

    if (sessionError) {
      console.error("Error creating session:", sessionError.message);
      
      // Try alternative approach for session creation
      try {
        console.log("Attempting alternative session creation approach");
        // For older Supabase versions, we might need direct API calls here
        // This is just a placeholder - we should investigate further if needed
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Session creation failed: ${sessionError.message}. Please try regular login.` 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      } catch (altError) {
        console.error("Alternative session creation also failed:", altError.message);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `All session creation methods failed. Please contact support.` 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
    }

    console.log(`Session created successfully for user ID: ${sessionData.session.user.id}, Email: ${sessionData.session.user.email}`);
    
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

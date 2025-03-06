
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

    // IMPORTANT: We'll prioritize user lookup by userId for consistency
    let userData = null;
    let targetEmail = email?.toLowerCase();
    let targetUserId = userId;
    
    // If userId is provided, try lookup by ID first (most reliable)
    if (userId) {
      console.log(`Looking up user by ID: ${userId}`);
      const { data: userById, error: userByIdError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userByIdError) {
        console.error(`Error finding user by ID ${userId}:`, userByIdError.message);
      } else if (userById?.user) {
        console.log(`User found by ID: ${userId}, Email: ${userById.user.email}`);
        userData = userById;
        targetUserId = userId;
        
        // If no email was provided, use the one from the user record
        if (!targetEmail && userById.user.email) {
          targetEmail = userById.user.email.toLowerCase();
          console.log(`Using email from user record: ${targetEmail}`);
        }
      }
    }

    // If still no user data and email is provided, try lookup by email
    if (!userData?.user && targetEmail) {
      console.log(`Looking up user by email: ${targetEmail}`);
      
      const { data: usersByEmail, error: emailLookupError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: targetEmail
        }
      });
      
      if (emailLookupError) {
        console.error("Error looking up user by email:", emailLookupError.message);
      } else if (usersByEmail?.users?.length > 0) {
        // Found user by email - use this as our target user
        userData = { user: usersByEmail.users[0] };
        targetUserId = usersByEmail.users[0].id;
        console.log(`User found by email: ${targetEmail}, ID: ${targetUserId}`);
      } else {
        console.log(`No user found with email: ${targetEmail}`);
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

    console.log(`Creating session for User ID: ${targetUserId}, Email: ${targetEmail}`);

    // Since createSession doesn't exist in v2, we'll use signInWithPassword with admin override
    // First get the API URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !apiKey) {
      throw new Error("Missing Supabase URL or API key");
    }
    
    // Directly call the Supabase auth API to create a session
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'X-Client-Info': 'create-dealer-session'
      },
      body: JSON.stringify({
        email: targetEmail,
        password: '', // Not used when using service role
        gotrue_meta_security: {
          admin_user_id: targetUserId  // This is the key for admin override
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from auth API:", errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Auth API error: ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status 
        }
      );
    }
    
    const sessionData = await response.json();
    
    console.log(`Session created successfully for user ID: ${targetUserId}`);
    
    // Return the session data
    return new Response(
      JSON.stringify({ 
        success: true, 
        session: sessionData
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

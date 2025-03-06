
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

    // Get Supabase URL and service key from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase URL or API key");
    }
    
    // NEW APPROACH: Use the generate_link endpoint to create a sign-in token
    // This is a completely different approach from the magiclink endpoint
    console.log("Using generate_link endpoint to create auth token");
    
    const generateLinkResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: targetEmail,
        options: {
          // Don't send the email, we just want the token
          data: { user_id: targetUserId }
        }
      })
    });
    
    if (!generateLinkResponse.ok) {
      const errorText = await generateLinkResponse.text();
      console.error("Error generating auth link:", errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Auth link generation error: ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: generateLinkResponse.status 
        }
      );
    }
    
    // Get the generated token data
    const linkData = await generateLinkResponse.json();
    console.log("Successfully generated auth token");
    
    // The linkData contains properties we need to exchange for a session
    // Now exchange this token for a session
    if (!linkData.action_link) {
      console.error("No action link returned from generate_link endpoint");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to generate authentication token" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Extract the token from the action link
    // The action link format is typically: https://your-project.supabase.co/auth/v1/verify?token=TOKEN&type=magiclink&redirect_to=
    const url = new URL(linkData.action_link);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.error("Could not extract token from action link");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid authentication token format" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Exchanging token for session");
    
    // Use the token to create a session
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        type: 'magiclink',
        token: token
      })
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error("Error verifying token:", errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Token verification error: ${errorText}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: verifyResponse.status 
        }
      );
    }
    
    // Get the session data
    const sessionData = await verifyResponse.json();
    
    console.log("Session created successfully using token verification");
    
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

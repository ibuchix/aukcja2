
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the admin key
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Create admin client for session management with properly formatted headers
const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        // Ensure correct case for headers
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    }
  }
);

// Generate authentication tokens
async function generateExchangeToken(userId: string, email: string) {
  // Get the JWT secret
  const jwtSecret = Deno.env.get("JWT_SECRET");
  
  if (!jwtSecret) {
    throw new Error("Missing JWT secret");
  }
  
  // Get Supabase URL to extract project ref
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
  }
  
  // Extract project ref from Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
  if (!projectRef) {
    throw new Error("Invalid SUPABASE_URL format");
  }
  
  // Create a key for signing from the JWT secret
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Current timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  
  // Create a token with the proper claims for Supabase Auth
  const accessToken = await create(
    { 
      alg: "HS256", 
      typ: "JWT" 
    },
    { 
      sub: userId,
      email: email,
      role: "authenticated",
      aud: projectRef,    // Set audience to the project ref
      iat: now,           // Issued at time
      exp: now + 3600,    // 1 hour expiry
      type: "access_token"
    },
    key
  );
  
  // Generate a UUID v4 for the refresh token (Supabase expects this format)
  const refreshToken = crypto.randomUUID();
  
  return {
    accessToken,
    refreshToken
  };
}

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

    console.log(`Generating auth tokens for User ID: ${targetUserId}, Email: ${targetEmail}`);

    // Generate tokens for authentication
    const tokens = await generateExchangeToken(targetUserId, targetEmail);
    
    if (!tokens.accessToken || !tokens.refreshToken) {
      console.error("Failed to generate authentication tokens");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to generate authentication tokens" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    console.log("Auth tokens generated successfully");
    
    // Get dealer profile information - adding detailed logging
    console.log(`Attempting to fetch dealer profile for user_id: ${targetUserId}`);
    console.log(`Using service role key: ${serviceRoleKey ? "present (redacted)" : "missing!"}`);
    
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .eq('user_id', targetUserId)
      .single();
      
    if (dealerError) {
      console.log("Dealer profile not found or error:", dealerError);
    } else {
      console.log("Dealer profile found:", dealerData ? "Yes" : "No");
    }
    
    // Return the tokens and user/dealer data
    return new Response(
      JSON.stringify({ 
        success: true, 
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: targetUserId,
          email: targetEmail
        },
        dealer: dealerData || null
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

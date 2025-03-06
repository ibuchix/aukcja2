
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

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

// Generate a temporary exchange token
async function generateExchangeToken(userId: string, email: string) {
  // Get the JWT secret
  const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET");
  
  if (!jwtSecret) {
    throw new Error("Missing JWT secret");
  }
  
  // Create a key for signing from the JWT secret
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Create a temporary token with a short expiry (5 minutes)
  const exchangeToken = await create(
    { 
      alg: "HS256", 
      typ: "JWT" 
    },
    { 
      sub: userId,
      email: email,
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minute expiry
      type: "dealer-exchange-token"
    },
    key
  );
  
  return exchangeToken;
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

    console.log(`Generating exchange token for User ID: ${targetUserId}, Email: ${targetEmail}`);

    // CLIENT-SIDE TOKEN EXCHANGE APPROACH
    // Generate a temporary exchange token that the client will use
    const exchangeToken = await generateExchangeToken(targetUserId, targetEmail);
    
    if (!exchangeToken) {
      console.error("Failed to generate exchange token");
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
    
    console.log("Exchange token generated successfully");
    
    // Get dealer profile information
    const { data: dealerData, error: dealerError } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .eq('user_id', targetUserId)
      .single();
      
    if (dealerError) {
      console.log("Dealer profile not found or error:", dealerError.message);
    }
    
    // Return the exchange token and user/dealer data
    return new Response(
      JSON.stringify({ 
        success: true, 
        exchangeToken: exchangeToken,
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

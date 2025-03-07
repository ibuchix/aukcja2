
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGenerateOtp, handleVerifyOtp, handleCheckEmail } from "./action-handlers.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    // Initialize Supabase client with service role
    const supabase = createServiceClient();
    
    // Parse request
    const { action, email, otp } = await req.json();
    
    // Log action (redact email for privacy)
    const safeEmail = email ? `${email.substring(0, 3)}...` : "undefined";
    console.log(`Processing ${action} request for ${safeEmail}`);
    
    // Process based on action
    let response;
    switch (action) {
      case "generate":
        response = await handleGenerateOtp(supabase, email);
        break;
        
      case "verify":
        response = await handleVerifyOtp(supabase, email, otp);
        break;
        
      case "check_email":
        response = await handleCheckEmail(supabase, email);
        break;
        
      default:
        console.error(`Invalid action requested: ${action}`);
        response = {
          success: false,
          error: `Invalid action: ${action}`
        };
        return new Response(JSON.stringify(response), { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
    }
    
    // Return response with CORS headers
    return new Response(JSON.stringify(response), { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${error.message}`
      }), { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

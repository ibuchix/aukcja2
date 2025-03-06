
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGenerateOtp, handleVerifyOtp, handleCheckEmail } from "./action-handlers.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    switch (action) {
      case "generate":
        return Response.json(
          await handleGenerateOtp(supabase, email),
          { headers: corsHeaders }
        );
        
      case "verify":
        return Response.json(
          await handleVerifyOtp(supabase, email, otp),
          { headers: corsHeaders }
        );
        
      case "check_email":
        return Response.json(
          await handleCheckEmail(supabase, email),
          { headers: corsHeaders }
        );
        
      default:
        console.error(`Invalid action requested: ${action}`);
        return Response.json({
          success: false,
          error: `Invalid action: ${action}`
        }, { 
          status: 400,
          headers: corsHeaders 
        });
    }
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return Response.json({
      success: false,
      error: `Server error: ${error.message}`
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

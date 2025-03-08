
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGenerateOtp, handleVerifyOtp, handleCheckEmail } from "./action-handlers.ts";
import { withErrorHandling } from "../_shared/error-handling.ts";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  // Use the error handling wrapper for better error responses
  return withErrorHandling(async () => {
    // Initialize Supabase client with service role
    const supabase = createServiceClient();
    
    // Parse request
    const payload = await req.json().catch(error => {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid JSON payload");
    });
    
    const { action, email, otp } = payload;
    
    // Validate required parameters
    if (!action) {
      throw new Error("Missing required parameter: action");
    }
    
    // Log action (redact email for privacy)
    const safeEmail = email ? `${email.substring(0, 3)}...` : "undefined";
    console.log(`Processing ${action} request for ${safeEmail}`);
    
    // Process based on action
    let response;
    switch (action) {
      case "generate":
        if (!email) {
          throw new Error("Missing required parameter: email");
        }
        response = await handleGenerateOtp(supabase, email);
        break;
        
      case "verify":
        if (!email || !otp) {
          throw new Error("Missing required parameters: email and/or otp");
        }
        response = await handleVerifyOtp(supabase, email, otp);
        break;
        
      case "check_email":
        if (!email) {
          throw new Error("Missing required parameter: email");
        }
        response = await handleCheckEmail(supabase, email);
        break;
        
      default:
        console.error(`Invalid action requested: ${action}`);
        throw new Error(`Invalid action: ${action}`);
    }
    
    return response;
  }, {
    module: "dealer-otp",
    headers: corsHeaders,
    action: payload?.action,
    email: payload?.email ? `${payload.email.substring(0, 3)}...` : undefined
  });
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { handleGenerateOtp, handleVerifyOtp, handleCheckEmail } from "./action-handlers.ts";
import { withErrorHandling } from "../_shared/error-handling.ts";

serve(async (req) => {
  // Handle CORS preflight request - OUTSIDE the error handling wrapper
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
    
    // Ensure response has proper CORS headers
    if (response instanceof Response) {
      // Add CORS headers to existing Response
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders
      });
    }
    
    // Create new response with CORS headers
    return new Response(
      JSON.stringify(response),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }, {
    module: "dealer-otp",
    headers: corsHeaders
  });
});

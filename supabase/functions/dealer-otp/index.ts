
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { withErrorHandling } from "../_shared/error-handling.ts";
import { handleGenerateOtp, handleVerifyOtp } from "./action-handlers.ts";

/**
 * Main request handler
 */
const handleRequest = async (req: Request): Promise<Response> => {
  console.log(`[dealer-otp] Received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client with service role for full access
    const supabase = createServiceClient();
    console.log(`[dealer-otp] Created Supabase client with service role`);
    
    // Parse request body
    const requestData = await req.json().catch(err => {
      console.error(`[dealer-otp] Error parsing request JSON:`, err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { action, email, otp } = requestData;
    
    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required 'action' parameter" 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }
    
    console.log(`[dealer-otp] Processing action: ${action} for email: ${email?.substring(0, 3)}...`);
    
    // Process different actions
    if (action === 'generate') {
      return await withErrorHandling(
        () => handleGenerateOtp(supabase, email),
        { action: 'generate', email }
      );
    } 
    else if (action === 'verify') {
      return await withErrorHandling(
        () => handleVerifyOtp(supabase, email, otp),
        { action: 'verify', email }
      );
    }
    
    // Invalid action
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Invalid action" 
      }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error(`[dealer-otp] Unhandled error:`, error);
    
    // Ensure even unhandled errors return with proper CORS headers
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        referenceId: crypto.randomUUID()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

// Start the server
serve(handleRequest);

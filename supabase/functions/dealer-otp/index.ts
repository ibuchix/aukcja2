
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { withErrorHandling } from "../_shared/error-handling.ts";
import { handleGenerateOtp, handleVerifyOtp } from "./action-handlers.ts";

/**
 * Main request handler
 */
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Create Supabase client
  const supabase = createServiceClient();
  
  // Parse request body
  const { action, email, otp } = await req.json();
  
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
};

// Start the server
serve(handleRequest);

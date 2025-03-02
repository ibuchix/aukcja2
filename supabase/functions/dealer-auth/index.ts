
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logDebug, logError, logInfo } from "./logging";
import { registerService, executeServiceAction } from "./service-registry";
import { handleEmailCheck, handleLogin, handleRegister } from "./handlers";
import { errorResponse, successResponse } from "./response-utils";
import { isEmailCheckRequest, isLoginRequest, isRegisterRequest } from "./types";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Register dealer authentication service
registerService({
  name: 'auth',
  handlers: {
    register: handleRegister,
    login: handleLogin,
    checkEmailExists: handleEmailCheck,
  }
});

// Log startup
logInfo("Startup checks completed successfully");

// Main request handler
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    logDebug('Received request', requestData);

    // Determine the action based on the request
    if (isRegisterRequest(requestData)) {
      const result = await handleRegister(requestData);
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } 
    else if (isLoginRequest(requestData)) {
      const result = await handleLogin(requestData);
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } 
    else if (isEmailCheckRequest(requestData)) {
      const result = await handleEmailCheck(requestData);
      return new Response(
        JSON.stringify(result),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    else {
      // Unknown action
      logWarn('Unknown request action', { action: requestData.action });
      return new Response(
        JSON.stringify(errorResponse('Invalid or missing action')),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    logError('Unexpected error handling request', { error });
    return new Response(
      JSON.stringify(errorResponse('Internal server error')),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Start the server
serve(handleRequest);

// Log missing import
function logWarn(message: string, context: any = {}) {
  console.warn(`[dealer-auth] [WARN] ${message}`, context);
}

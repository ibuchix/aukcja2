
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logDebug, logError, logInfo, logWarn } from "./logging.ts";
import { handleCheckEmailExists, handleLogin, handleRegister } from "./handlers.ts";
import { respondError, respondSuccess } from "./response-utils.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Log startup
logInfo("Dealer auth edge function starting");

// Main request handler
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // Use 204 No Content for OPTIONS
      headers: corsHeaders 
    });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    logDebug('Received request', requestData);

    // Determine the action based on the request
    const action = requestData.action;
    
    let result;
    switch(action) {
      case 'register':
        result = await handleRegister(requestData);
        break;
      case 'login':
        result = await handleLogin(requestData);
        break;
      case 'checkEmailExists':
        result = await handleCheckEmailExists(requestData);
        break;
      default:
        // Unknown action
        logWarn('Unknown request action', { action });
        return new Response(
          JSON.stringify(respondError('Invalid or missing action', 400)),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: result.status || 200
      }
    );
  } catch (error) {
    // Handle unexpected errors
    logError('Unexpected error handling request', { error });
    return new Response(
      JSON.stringify(respondError('Internal server error', 500)),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Start the server
serve(handleRequest);

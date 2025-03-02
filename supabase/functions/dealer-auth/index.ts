
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handlers } from "./handlers.ts";
import { log, logError } from "./logging.ts";
import { formatErrorResponse } from "./response-utils.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// Process startup checks
try {
  log("Startup checks completed successfully");
} catch (e) {
  logError(`Startup checks failed: ${e.message}`);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { action, ...requestData } = await req.json();

    // Validate input
    if (!action || typeof action !== "string") {
      return formatErrorResponse("Missing or invalid 'action' parameter", 400, corsHeaders);
    }

    // Check if handler exists for action
    if (!handlers[action] || typeof handlers[action] !== "function") {
      return formatErrorResponse(`Unknown action: ${action}`, 400, corsHeaders);
    }

    log(`Processing action: ${action}`);

    // Call the appropriate handler with request data
    const response = await handlers[action](req, requestData);
    
    // Add CORS headers to response
    const headers = { ...corsHeaders, ...response.headers };
    
    // Return the response with CORS headers
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    logError(`Unhandled error in request processing: ${error.message}`);
    return formatErrorResponse(
      `Internal server error: ${error.message}`,
      500, 
      corsHeaders
    );
  }
};

serve(handler);

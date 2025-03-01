
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlers } from "./handlers.ts";
import { logOperation, logError } from "./logging.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse } from "./response-utils.ts";

// Concurrent registration lock registry
const registrationLocks = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request to get action
    const requestData = await req.json();
    const action = requestData.action;

    if (!action) {
      return errorResponse('Missing action parameter', 400);
    }

    logOperation(`Function invoked with action: ${action}`, requestData);

    // Check if handler exists for this action
    if (!handlers[action]) {
      return errorResponse(`Unknown action: ${action}`, 400);
    }

    // Execute handler with special case for registration with lock
    if (action === 'register-with-lock') {
      return await handlers[action](req, registrationLocks);
    } else {
      return await handlers[action](req);
    }

  } catch (error) {
    logError('Unexpected error in dealer-auth function', error);
    return errorResponse('Internal server error', 500);
  }
});

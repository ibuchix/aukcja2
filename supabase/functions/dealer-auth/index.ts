
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleRegister, handleCheckEmailExists, handleLogin } from './handlers.ts';
import { logError, logInfo } from './logging.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

console.log('Module initialized successfully');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Add CORS headers to all responses
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      );
    }

    // Parse request body
    let reqBody;
    try {
      reqBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers }
      );
    }

    // Log the request for debugging
    logInfo(`Received request with action: ${reqBody.action}`, { 
      action: reqBody.action,
      email: reqBody.email ? `${reqBody.email.substring(0, 3)}...` : undefined 
    });

    // Route requests based on action
    let result;
    switch (reqBody.action) {
      case 'register':
        result = await handleRegister(reqBody);
        break;
      case 'checkEmailExists':
        result = await handleCheckEmailExists(reqBody);
        break;
      case 'login':
        result = await handleLogin(reqBody);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : (result.status || 400), headers }
    );

  } catch (error) {
    // Log and return any unhandled errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = error instanceof Error && 'status' in error ? (error as any).status : 500;
    
    logError(`Unhandled error in dealer-auth: ${errorMessage}`, { error });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: errorStatus, headers }
    );
  }
});

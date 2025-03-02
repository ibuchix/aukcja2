
import { corsHeaders } from '@shared/cors.ts';
import { handleRegister, handleLogin, handleVerifyPassword } from './handlers.ts';
import { performStartupChecks } from '@shared/startup.ts';

// Perform startup validation checks at the entry point
performStartupChecks('dealer-auth/index');

// Define explicit CORS headers for this function
const dealerAuthCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

// Primary function handler for all dealer auth requests
Deno.serve(async (req) => {
  // Handle health check endpoint
  if (req.url.endsWith("/health")) {
    return new Response(JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: dealerAuthCorsHeaders,
      status: 204
    });
  }

  try {
    // Parse request body ONCE - this is the critical fix
    const body = await req.json();
    const action = body.action;

    console.log(`Dealer auth request received for action: ${action}`);

    let response;
    
    // Route to appropriate handler based on action, passing the parsed body
    switch (action) {
      case 'register':
      case 'register-with-lock':
        response = await handleRegister(body, req.headers);
        break;
      
      case 'login':
        response = await handleLogin(body, req.headers);
        break;
      
      case 'verify-password':
        response = await handleVerifyPassword(body, req.headers);
        break;
        
      default:
        response = new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
    }

    // Add the CORS headers to the response
    const responseHeaders = new Headers(response.headers);
    Object.entries(dealerAuthCorsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    // Return the response with CORS headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Unexpected error processing dealer-auth request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...dealerAuthCorsHeaders
        }
      }
    );
  }
});

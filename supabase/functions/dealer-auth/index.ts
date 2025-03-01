
import { corsHeaders } from '@shared/cors.ts';
import { handleRegister, handleLogin, handleVerifyPassword } from './handlers.ts';

// Primary function handler for all dealer auth requests
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse request to determine the action
    const body = await req.json();
    const action = body.action;

    console.log(`Dealer auth request received for action: ${action}`);

    // Route to appropriate handler based on action
    switch (action) {
      case 'register':
      case 'register-with-lock':
        return await handleRegister(req);
      
      case 'login':
        return await handleLogin(req);
      
      case 'verify-password':
        return await handleVerifyPassword(req);
        
      default:
        return new Response(
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
          ...corsHeaders
        }
      }
    );
  }
});

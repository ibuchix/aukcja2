
import { corsHeaders } from '@shared/cors.ts';
import { handleLogin, handleRegister, handleVerifyPassword } from './handlers.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the endpoint from URL path
  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  try {
    // Route to the appropriate handler
    switch (endpoint) {
      case 'register':
        return await handleRegister(req);
      case 'login':
        return await handleLogin(req);
      case 'verify-password':
        return await handleVerifyPassword(req);
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }
  } catch (error) {
    console.error(`Unhandled error:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

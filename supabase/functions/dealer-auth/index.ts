import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { registerService } from './service-registry.ts';
import { handlers } from './handlers.ts';

// Main handler function
serve(async (req: Request) => {
  console.log('dealer-auth function started.');
  
  try {
    // Check that startup requirements are met
    await registerService();

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Parse request body
    let requestData: any = {};
    try {
      requestData = await req.json();
    } catch (e) {
      console.error(`Error parsing request JSON: ${e.message}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...payload } = requestData;

    // Log the request for debugging
    console.log(`Received action: ${action}`);

    // Check if action is specified
    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'No action specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if handler exists for the action
    if (!handlers[action]) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the appropriate handler
    return await handlers[action](req, payload);

  } catch (error) {
    console.error(`Unhandled error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ success: false, error: `Dealer auth service error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

export { handlers };

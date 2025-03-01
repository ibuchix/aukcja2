
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { handleLogin, handleRegister } from './handlers.ts';
import type { DealerAuthRequest } from './types.ts';

serve(async (req) => {
  console.log(`${req.method} request received`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Missing environment variables');
    }

    console.log('Creating Supabase client with service role');
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let requestData;
    try {
      requestData = await req.json();
      console.log(`Request action: ${requestData.action}`);
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON payload' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    const { action, ...data } = requestData as DealerAuthRequest;

    if (action === 'register') {
      console.log('Processing registration request');
      const response = await handleRegister(supabaseClient, data as any);
      console.log(`Registration response status: ${response.success ? 'success' : 'failure'}`);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400
      });
    }

    if (action === 'login') {
      console.log('Processing login request');
      const response = await handleLogin(supabaseClient, data as any);
      console.log(`Login response status: ${response.success ? 'success' : 'failure'}`);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 401
      });
    }

    console.error(`Invalid action: ${action}`);
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Unexpected error processing request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

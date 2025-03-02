
import { serve } from 'https://deno.land/std@0.182.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { checkForRateLimit } from '../_shared/rate-limiter.ts';
import { createErrorResponse } from './response-utils.ts';
import { checkEmailExists, registerUser, loginUser } from './handlers.ts';
import { logError, logInfo, logRequest } from './logging.ts';
import { validateRegisterRequest, validateLoginRequest, validateEmailCheckRequest } from './service-registry.ts';

// Set up Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables for Supabase connection');
}

// Create a single supabase client for the function
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get request details
  const requestId = crypto.randomUUID();
  const clientIp = req.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Handle rate limiting
    const { isLimited, retryAfter } = await checkForRateLimit(clientIp, 'dealer-auth', 60, 30);
    if (isLimited) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Rate limit exceeded' 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString() 
          } 
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON payload', 400);
    }

    // Log request (sanitize sensitive data)
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    logRequest(requestId, req.method, sanitizedBody);

    // Process based on action type
    const action = body.action;
    logInfo(`Processing ${action} request`);

    switch (action) {
      case 'register':
        // Validate register request
        const registerValidation = validateRegisterRequest(body);
        if (!registerValidation.valid) {
          return createErrorResponse(registerValidation.error || 'Invalid registration data', 400);
        }
        return await registerUser(supabase, body);

      case 'login':
        // Validate login request
        const loginValidation = validateLoginRequest(body);
        if (!loginValidation.valid) {
          return createErrorResponse(loginValidation.error || 'Invalid login data', 400);
        }
        return await loginUser(supabase, body);

      case 'checkEmailExists':
        // Validate email check request
        const emailCheckValidation = validateEmailCheckRequest(body);
        if (!emailCheckValidation.valid) {
          return createErrorResponse(emailCheckValidation.error || 'Invalid email check data', 400);
        }
        return await checkEmailExists(supabase, body);

      default:
        return createErrorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    // Log and handle unexpected errors
    logError(`Unhandled error in dealer-auth function (${requestId}):`, error);
    return createErrorResponse(
      'An unexpected error occurred processing your request',
      500
    );
  }
});

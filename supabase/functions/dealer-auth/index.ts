
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { RateLimiter } from '../_shared/rate-limiter.ts'
import { createErrorResponse } from './response-utils.ts'
import { handleLogin, handleRegistration } from './handlers.ts'
import { logAuthEvent } from './logging.ts'
import type { AuthRequest } from './types.ts'

// Initialize rate limiter
const limiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "minute"
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Rate limiting check
    if (!await limiter.check(req)) {
      logAuthEvent(req, 'rate_limit_exceeded', 'unknown', 'failure', 'Too many requests')
      return new Response("Too many requests", {
        status: 429,
        headers: corsHeaders
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseKey) {
      logAuthEvent(req, 'configuration_error', 'unknown', 'failure', 'Service configuration error')
      return createErrorResponse('Service configuration error');
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          pool: { min: 2, max: 10 }
        }
      }
    )

    const requestData = await req.json() as AuthRequest
    const { action, email } = requestData

    if (!email || !requestData.password) {
      logAuthEvent(req, action || 'unknown', email || 'unknown', 'failure', 'Missing credentials')
      return createErrorResponse('Email and password are required')
    }

    if (action === 'register') {
      return await handleRegistration(supabaseClient, requestData, req)
    } else if (action === 'login') {
      return await handleLogin(supabaseClient, requestData, req)
    }

    logAuthEvent(req, 'invalid_action', email, 'failure', 'Invalid action')
    return createErrorResponse('Invalid action')

  } catch (err) {
    logAuthEvent(
      req, 
      'error', 
      'unknown', 
      'failure', 
      err instanceof Error ? err.message : 'An unexpected error occurred'
    )
    return createErrorResponse(err instanceof Error ? err.message : 'An unexpected error occurred')
  }
})

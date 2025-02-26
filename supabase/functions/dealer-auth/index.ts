
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { RateLimiter } from '../_shared/rate-limiter.ts'
import { createErrorResponse } from './response-utils.ts'
import { handleLogin, handleRegistration } from './handlers.ts'
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
    console.log('Request received:', new Date().toISOString())
    
    // Rate limiting check
    if (!await limiter.check(req)) {
      return new Response("Too many requests", {
        status: 429,
        headers: corsHeaders
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseKey) {
      return createErrorResponse('Service configuration error');
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestData = await req.json() as AuthRequest
    const { action, email } = requestData

    if (!email || !requestData.password) {
      return createErrorResponse('Email and password are required')
    }

    if (action === 'register') {
      return await handleRegistration(supabaseClient, requestData)
    } else if (action === 'login') {
      return await handleLogin(supabaseClient, requestData)
    }

    return createErrorResponse('Invalid action')

  } catch (err) {
    console.error('Request failed:', {
      timestamp: new Date().toISOString(),
      errorType: err.constructor.name,
      errorMessage: err.message
    })
    
    return createErrorResponse(err instanceof Error ? err.message : 'An unexpected error occurred')
  }
})

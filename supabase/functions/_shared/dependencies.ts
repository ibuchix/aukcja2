
// Common utility functions and shared dependencies
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from './cors.ts';

export interface RequestError {
  message: string;
  status?: number;
  code?: string;
}

export function createEdgeClient(req: Request) {
  // Create a Supabase client with the Auth context of the function
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! }
    },
    auth: {
      persistSession: false,
    }
  });
}

// Helper to create standardized responses
export function createResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

export function createErrorResponse(error: RequestError, status = 400) {
  console.error(`Error: ${error.message}`, error);
  return createResponse({ 
    success: false, 
    error: error.message,
    code: error.code || 'unknown_error'
  }, error.status || status);
}

// Simple validation helper
export function validateRequiredFields(data: any, fields: string[]) {
  for (const field of fields) {
    if (!data[field]) {
      throw {
        message: `Missing required field: ${field}`,
        status: 400,
        code: 'missing_field'
      };
    }
  }
}

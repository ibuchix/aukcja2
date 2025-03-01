import { createClient } from '@supabase/supabase-js';

// This function creates a Supabase client with service role privileges
// Use this for admin operations that require bypassing RLS
export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
      }
    }
  );
}

// Function to create a client with user context from the request
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

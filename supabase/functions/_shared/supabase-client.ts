
import { createClient } from '@supabase/supabase-js';

// Implement strict singleton pattern for Supabase clients
let serviceClientInstance: ReturnType<typeof createClient> | null = null;

// This function creates a Supabase client with service role privileges
// Use this for admin operations that require bypassing RLS
export function createServiceClient() {
  if (!serviceClientInstance) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }
    
    serviceClientInstance = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }
  
  return serviceClientInstance;
}

// Function to create a client with user context from the request
// This is not a singleton as it depends on the request context
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

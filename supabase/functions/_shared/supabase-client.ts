
import { createClient } from '@supabase/supabase-js';

// Supabase client with service role for admin operations
export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables:', {
      urlPresent: !!supabaseUrl,
      keyPresent: !!supabaseServiceKey
    });
    throw new Error('Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  // Create client with service role for bypassing RLS
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  console.log('Service client created successfully');
  return client;
}

// Edge client that can be created from headers or a request object
export function createEdgeClient(reqOrHeaders: Request | Headers) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables for edge client');
    throw new Error('Missing Supabase environment variables. Check SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  
  let headers: Headers;
  
  // Determine if we received a Request object or Headers object
  if (reqOrHeaders instanceof Request) {
    headers = reqOrHeaders.headers;
  } else if (reqOrHeaders instanceof Headers) {
    headers = reqOrHeaders;
  } else {
    // If neither, create empty headers
    headers = new Headers();
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        // Forward authorization headers
        Authorization: headers.get('Authorization') || '',
        // Forward apikey header if present
        apikey: headers.get('apikey') || supabaseAnonKey,
        // Include client info if available
        'x-client-info': headers.get('x-client-info') || ''
      }
    }
  });
}

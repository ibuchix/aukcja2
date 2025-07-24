
// Import from the correct URL path to avoid bundler errors
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Supabase client with service role for admin operations
export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('=== Service Client Creation Debug ===');
  console.log(`SUPABASE_URL in createServiceClient: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY in createServiceClient: ${supabaseServiceKey ? `SET (${supabaseServiceKey.substring(0, 20)}...)` : 'NOT SET'}`);
  
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
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Set both headers to ensure service role authentication
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
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

// Safe wrapper around RPC functions to handle permission errors
export async function callRpcSafely<T>(
  supabase: ReturnType<typeof createServiceClient>,
  functionName: string,
  params: Record<string, any> = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Log the exact parameters being passed to the RPC function
    console.log(`Calling RPC function: ${functionName}`);
    console.log(`Parameters: ${JSON.stringify(params)}`);
    
    // Print supabase client info to verify it's correctly configured
    console.log(`Using Supabase client with URL: ${supabase.getUrl ? supabase.getUrl() : 'unknown'}`);
    
    // Ensure headers are properly set before RPC call
    const headers = supabase.auth.headers || {};
    console.log(`Request headers for RPC call:`, headers);
    
    // Make the RPC call with exact parameter format
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      
      // Provide more details for debugging
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      if (error.message) {
        console.error(`Error message: ${error.message}`);
      }
      if (error.details) {
        console.error(`Error details: ${error.details}`);
      }
      
      return { data: null, error };
    }
    
    // Log the result success/failure
    if (data === null) {
      console.log(`${functionName} returned null data (no error)`);
    } else {
      console.log(`Successfully called ${functionName} with data`);
    }
    
    return { data, error: null };
  } catch (err) {
    console.error(`Exception calling ${functionName}:`, err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

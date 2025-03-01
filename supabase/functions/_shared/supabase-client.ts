
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// We use env vars for the Supabase URL and key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Create a Supabase client with the service role key
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a client with anon key for public operations
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
export const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create an edge client with request context
export const createEdgeClient = (req: Request) => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") || "",
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// For backwards compatibility
export const createClient = () => {
  return supabase;
};

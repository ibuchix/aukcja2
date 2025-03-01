// This file now serves as a redirector to maintain backward compatibility
// while eliminating circular dependencies

import { createClient } from '@supabase/supabase-js';
import { performStartupChecks } from './startup.ts';

// Create a singleton service client
let serviceClient: any = null;

/**
 * Creates and returns a Supabase client with service role permissions
 */
export const createServiceClient = () => {
  // Perform startup checks
  performStartupChecks('createServiceClient');
  
  // Return existing client if available
  if (serviceClient) {
    return serviceClient;
  }
  
  // Create new client if not already created
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return serviceClient;
};

/**
 * Creates and returns a fresh Supabase client for edge function usage
 * Should be used for per-request operations
 */
export const createEdgeClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Export the verify function for backwards compatibility
export { verifyDependencies } from './startup.ts';

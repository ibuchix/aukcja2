
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

// Create the main Supabase client with enhanced session persistence
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Create the raw Supabase client with enhanced configuration for session persistence
export const rawSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'sb-auth-token'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'dealer-portal@1.0.0'
    }
  }
});

// Export the raw client as the main client to ensure JWT token consistency
export const supabase = rawSupabaseClient;

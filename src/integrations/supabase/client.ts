
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create the main Supabase client with enhanced session persistence
const supabaseUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";

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

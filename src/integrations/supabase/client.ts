
import { createClient } from '@supabase/supabase-js';
import { createEnhancedSupabaseClient } from '@/utils/enhancedSupabaseClient';
import type { Database } from './types';

// Create the main Supabase client
const supabaseUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";

// Create the raw Supabase client
export const rawSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create the enhanced version that wraps the authenticated client
export const enhancedSupabase = createEnhancedSupabaseClient(rawSupabaseClient);

// Export both for compatibility
export const supabase = enhancedSupabase;

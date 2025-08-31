/**
 * Supabase Configuration Module
 * Centralizes Supabase credentials with environment variable support and fallbacks
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Validates environment variables and provides fallback values
 * Uses Vite's import.meta.env for proper Vite app compatibility
 */
function getSupabaseConfig(): SupabaseConfig {
  // Get environment variables (Vite style)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Fallback values for development (matches current hardcoded values)
  const fallbackUrl = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
  const fallbackAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";
  
  // Use environment variables if available, otherwise fallback
  const config: SupabaseConfig = {
    url: envUrl || fallbackUrl,
    anonKey: envAnonKey || fallbackAnonKey
  };
  
  // Validate configuration
  if (!config.url || !config.anonKey) {
    throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
  }
  
  // Log configuration source (without exposing sensitive keys)
  if (import.meta.env.DEV) {
    console.log('🔧 Supabase Config:', {
      url: config.url,
      anonKeySource: envAnonKey ? 'environment' : 'fallback',
      urlSource: envUrl ? 'environment' : 'fallback'
    });
  }
  
  return config;
}

// Export the configuration
export const supabaseConfig = getSupabaseConfig();

// Export individual values for convenience
export const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = supabaseConfig;
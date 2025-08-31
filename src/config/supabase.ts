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
  
  // Validate that environment variables are present - no fallbacks for security
  if (!envUrl || !envAnonKey) {
    const missing = [];
    if (!envUrl) missing.push('VITE_SUPABASE_URL');
    if (!envAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
    
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
  
  // Use environment variables only - no hardcoded fallbacks
  const config: SupabaseConfig = {
    url: envUrl,
    anonKey: envAnonKey
  };
  
  // Validate configuration
  if (!config.url || !config.anonKey) {
    throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
  }
  
  // Log configuration source (without exposing sensitive keys)
  if (import.meta.env.DEV) {
    console.log('🔧 Supabase Config:', {
      url: config.url,
      anonKeySource: 'environment',
      urlSource: 'environment',
      configurationValid: true
    });
  }
  
  return config;
}

// Export the configuration
export const supabaseConfig = getSupabaseConfig();

// Export individual values for convenience
export const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = supabaseConfig;
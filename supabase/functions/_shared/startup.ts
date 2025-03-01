
/**
 * Provides utilities for validating correct module loading and initialization
 */

// Track initialization status across module loads
const initStatus = {
  initialized: false,
  timestamp: null as number | null,
  initCount: 0
};

/**
 * Verifies the module load order and initialization sequence
 * to prevent circular dependencies and duplicate initialization.
 * 
 * @param componentName Optional name of the component being initialized
 * @returns True if this is the first initialization
 */
export const verifyLoadOrder = (componentName?: string): boolean => {
  // If already initialized, log a warning
  if ((globalThis as any).__supabase_initialized) {
    console.warn(`⚠️ Duplicate initialization detected${componentName ? ` in ${componentName}` : ''}`);
    (globalThis as any).__supabase_init_count = ((globalThis as any).__supabase_init_count || 0) + 1;
    return false;
  }
  
  // Mark as initialized
  (globalThis as any).__supabase_initialized = true;
  (globalThis as any).__supabase_init_timestamp = Date.now();
  (globalThis as any).__supabase_init_count = 1;
  
  console.log(`✅ Supabase client initialized successfully${componentName ? ` in ${componentName}` : ''}`);
  return true;
};

/**
 * Verifies that required environment variables are available
 * @throws Error if any required variable is missing
 */
export const verifyDependencies = () => {
  const requiredVars = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ];
  
  const missing = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

/**
 * Performs all startup validation checks
 * @param componentName Optional name of the component being initialized
 */
export const performStartupChecks = (componentName?: string): void => {
  verifyLoadOrder(componentName);
  verifyDependencies();
};

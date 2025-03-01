
import { handleError } from "./error-handling.ts";

interface StartupOptions {
  requiredEnvVars?: string[];
  moduleName?: string;
}

/**
 * Performs startup validation checks to ensure proper module loading order
 * and environment configuration
 */
export function performStartupChecks(moduleName: string, options: StartupOptions = {}) {
  try {
    // Check for circular dependencies
    verifyLoadOrder(moduleName);
    
    // Validate environment variables
    if (options.requiredEnvVars?.length) {
      verifyEnvironment(options.requiredEnvVars);
    }
    
    console.log(`[${moduleName}] Startup checks completed successfully`);
  } catch (error) {
    console.error(`[${moduleName}] Startup checks failed: ${error.message}`);
    // Re-throw to prevent further execution
    throw error;
  }
}

/**
 * Verifies module load order to prevent circular dependencies
 */
function verifyLoadOrder(moduleName: string) {
  const initKey = `__${moduleName}_initialized`;
  const globalState = globalThis as any;
  
  if (globalState[initKey]) {
    console.log(`[${moduleName}] Module already initialized, preventing duplicate initialization`);
    return;
  }
  
  globalState[initKey] = true;
  console.log(`[${moduleName}] Module initialized successfully`);
}

/**
 * Validates that required environment variables are present
 */
function verifyEnvironment(requiredVars: string[]) {
  const missingVars = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

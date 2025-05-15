
import { logError } from "./logging.ts";

/**
 * Verify environment variables are available
 */
export function checkEnvironment(): boolean {
  const vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = vars.filter(v => !Deno.env.get(v));
  if (missing.length > 0) {
    logError(`Missing environment variables: ${missing.join(", ")}`, null);
    return false;
  }
  return true;
}

// Check environment on module load
export const environmentValid = checkEnvironment();

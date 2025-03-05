
// This file now serves as a redirector to maintain backward compatibility
// while eliminating circular dependencies

import { createServiceClient as createClient } from './supabase-client.ts';
import { performStartupChecks } from './startup.ts';

// Export the createServiceClient function from supabase-client.ts
export const createServiceClient = createClient;

// Export the performStartupChecks function as verifyDependencies for backwards compatibility
export { performStartupChecks as verifyDependencies } from './startup.ts';

// Export the createEdgeClient function from supabase-client.ts
export { createEdgeClient } from './supabase-client.ts';


/**
 * This file serves as a redirector to maintain backward compatibility
 * while eliminating circular dependencies
 */

import { createServiceClient, createEdgeClient } from './dependencies.ts';
import { performStartupChecks } from './startup.ts';

// Perform startup checks when this module is loaded
performStartupChecks('supabase-client');

export { createServiceClient, createEdgeClient };

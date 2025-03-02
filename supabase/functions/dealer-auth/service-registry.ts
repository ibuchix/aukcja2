
// A simple service registry for the dealer auth function
// This helps organize different services and their functionality

/**
 * Service registration interface
 */
export interface ServiceDefinition {
  name: string;
  handlers: Record<string, (...args: any[]) => Promise<any>>;
}

// Store registered services
const serviceRegistry: Record<string, ServiceDefinition> = {};

/**
 * Register a service with its handlers
 */
export function registerService(service: ServiceDefinition): void {
  if (serviceRegistry[service.name]) {
    console.warn(`Service ${service.name} already registered. Overwriting.`);
  }
  serviceRegistry[service.name] = service;
  console.log(`Service ${service.name} registered successfully`);
}

/**
 * Get a service handler by name and action
 */
export function getServiceHandler(serviceName: string, handlerName: string): ((...args: any[]) => Promise<any>) | null {
  const service = serviceRegistry[serviceName];
  if (!service) {
    console.error(`Service ${serviceName} not found`);
    return null;
  }

  const handler = service.handlers[handlerName];
  if (!handler) {
    console.error(`Handler ${handlerName} not found in service ${serviceName}`);
    return null;
  }

  return handler;
}

/**
 * Execute a service action
 */
export async function executeServiceAction(
  serviceName: string, 
  actionName: string, 
  params: any
): Promise<any> {
  const handler = getServiceHandler(serviceName, actionName);
  
  if (!handler) {
    throw new Error(`Action ${actionName} not available in service ${serviceName}`);
  }
  
  try {
    return await handler(params);
  } catch (error) {
    console.error(`Error executing ${serviceName}.${actionName}:`, error);
    throw error;
  }
}

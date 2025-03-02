
// Service registry for dealer authentication

type ServiceHandler = (...args: any[]) => Promise<any>;

interface Service {
  name: string;
  handlers: Record<string, ServiceHandler>;
}

const services: Record<string, Service> = {};

/**
 * Register a service with its handlers
 */
export function registerService(service: Service): void {
  services[service.name] = service;
  console.log(`Service "${service.name}" registered with handlers: ${Object.keys(service.handlers).join(', ')}`);
}

/**
 * Execute a service action
 */
export async function executeServiceAction(
  serviceName: string,
  action: string,
  payload: any
): Promise<any> {
  const service = services[serviceName];
  
  if (!service) {
    throw new Error(`Service "${serviceName}" not found`);
  }
  
  const handler = service.handlers[action];
  
  if (!handler) {
    throw new Error(`Action "${action}" not found in service "${serviceName}"`);
  }
  
  return await handler(payload);
}


// Logging utilities for dealer auth operations

/**
 * Logs an operation with context data
 */
export function logOperation(operation: string, data?: Record<string, any>) {
  const logData = {
    operation,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  };
  
  console.log(`[DEALER-AUTH] ${operation}:`, JSON.stringify(logData));
}

/**
 * Logs an error with context
 */
export function logError(context: string, error: any) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorData = {
    context,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    ...(error instanceof Error && error.stack && { stack: error.stack })
  };
  
  console.error(`[DEALER-AUTH ERROR] ${context}:`, JSON.stringify(errorData));
}

export interface AuthLogEvent {
  type: "AUTH_EVENT"
  action: string
  email: string
  timestamp: string
  status: "success" | "failure"
  error?: string
  metadata: {
    user_agent?: string | null
    ip?: string | null
  }
}

export function logAuthEvent(
  req: Request,
  action: string,
  email: string,
  status: "success" | "failure",
  error?: string
) {
  const event: AuthLogEvent = {
    type: "AUTH_EVENT",
    action,
    email,
    timestamp: new Date().toISOString(),
    status,
    ...(error && { error }),
    metadata: {
      user_agent: req.headers.get("user-agent"),
      ip: req.headers.get("cf-connecting-ip")
    }
  };
  
  console.log(JSON.stringify(event));
}

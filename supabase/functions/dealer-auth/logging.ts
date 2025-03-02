
// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Configure minimum log level (can be adjusted for more or less verbosity)
const MIN_LOG_LEVEL = LOG_LEVELS.DEBUG;

function formatLogObject(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return `[Unstringifiable Object: ${typeof obj}]`;
  }
}

export function logDebug(message: string, data?: any): void {
  if (MIN_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    if (data) {
      console.log(`[dealer-auth] [${new Date().toISOString()}] [DEBUG] ${message}`, formatLogObject(data));
    } else {
      console.log(`[dealer-auth] [${new Date().toISOString()}] [DEBUG] ${message}`);
    }
  }
}

export function logInfo(message: string, data?: any): void {
  if (MIN_LOG_LEVEL <= LOG_LEVELS.INFO) {
    if (data) {
      console.log(`[dealer-auth] [${new Date().toISOString()}] [INFO] ${message}`, formatLogObject(data));
    } else {
      console.log(`[dealer-auth] [${new Date().toISOString()}] [INFO] ${message}`);
    }
  }
}

export function logWarning(message: string, data?: any): void {
  if (MIN_LOG_LEVEL <= LOG_LEVELS.WARN) {
    if (data) {
      console.warn(`[dealer-auth] [${new Date().toISOString()}] [WARN] ${message}`, formatLogObject(data));
    } else {
      console.warn(`[dealer-auth] [${new Date().toISOString()}] [WARN] ${message}`);
    }
  }
}

export function logError(message: string, error?: any): void {
  if (MIN_LOG_LEVEL <= LOG_LEVELS.ERROR) {
    if (error) {
      console.error(`[dealer-auth] [${new Date().toISOString()}] [ERROR] ${message}`, formatLogObject(error));
    } else {
      console.error(`[dealer-auth] [${new Date().toISOString()}] [ERROR] ${message}`);
    }
  }
}

// Add a function to log request details
export function logRequest(requestId: string, method: string, body: any): void {
  logInfo(`Request ${requestId} | ${method}`, body);
}

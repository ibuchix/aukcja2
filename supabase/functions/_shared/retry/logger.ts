
/**
 * Attempts to import the performance logger module
 * @returns The logger or null if not available
 */
export async function getPerformanceLogger() {
  try {
    const { logPerformanceMetrics } = await import('../../proxy-bidding-processor/logging.ts');
    return logPerformanceMetrics;
  } catch {
    return null;
  }
}

/**
 * Attempts to import the retry logger
 * @returns The logger or null if not available
 */
export async function getRetryLogger() {
  try {
    const { logRetryAttempt } = await import('../../proxy-bidding-processor/logging.ts');
    return logRetryAttempt;
  } catch {
    return null;
  }
}

/**
 * Log performance metrics with fallback to console
 */
export async function logPerformance(
  module: string,
  operationName: string,
  durationMs: number,
  success: boolean,
  details: Record<string, any>
): Promise<void> {
  try {
    const logger = await getPerformanceLogger();
    if (logger) {
      await logger(module, operationName, durationMs, success, details);
    } else {
      const statusText = success ? 'completed successfully' : 'failed';
      console.log(`[PERF] ${module}/${operationName} ${statusText} in ${durationMs}ms`, details);
    }
  } catch (error) {
    console.error(`Failed to log performance metrics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Log retry attempt with fallback to console
 */
export async function logRetry(
  module: string,
  operationName: string,
  attempt: number,
  maxRetries: number,
  error: any,
  context: Record<string, any> = {},
  isFinal: boolean = false
): Promise<void> {
  try {
    const logger = await getRetryLogger();
    if (logger) {
      await logger(module, operationName, attempt, maxRetries, error, { ...context, final: isFinal });
    } else {
      const finalText = isFinal ? ' (final attempt)' : '';
      console.log(`Retry ${attempt}/${maxRetries}${finalText} for ${module}/${operationName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch {
    // If logging fails, fall back to basic console logging
    console.log(`Retry ${attempt}/${maxRetries} for ${module}/${operationName}`);
  }
}

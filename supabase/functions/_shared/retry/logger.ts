
/**
 * Log performance metrics with console fallback
 */
export async function logPerformance(
  module: string,
  operationName: string,
  durationMs: number,
  success: boolean,
  details: Record<string, any>
): Promise<void> {
  try {
    const statusText = success ? 'completed successfully' : 'failed';
    console.log(`[PERF] ${module}/${operationName} ${statusText} in ${durationMs}ms`, details);
  } catch (error) {
    console.error(`Failed to log performance metrics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Log retry attempt with console fallback
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
    const finalText = isFinal ? ' (final attempt)' : '';
    console.log(`Retry ${attempt}/${maxRetries}${finalText} for ${module}/${operationName}: ${error instanceof Error ? error.message : String(error)}`, context);
  } catch {
    // If logging fails, fall back to basic console logging
    console.log(`Retry ${attempt}/${maxRetries} for ${module}/${operationName}`);
  }
}

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { handleDealerRegister } from "./handlers.ts";
import { respondSuccess, respondError } from "./response-utils.ts";
import { logRequest, logError, logInfo } from "./logging.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MAX_RETRIES = 3;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();
    logRequest(req);

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return respondError("Invalid JSON in request body", 400, corsHeaders);
    }

    const { action, requestId } = body;
    
    // Generate a request ID if none was provided
    const trackingId = requestId || crypto.randomUUID();
    logInfo(`Processing request ${trackingId} for action: ${action}`);

    // Handle the different actions
    switch (action) {
      case "register":
        return await processWithRetry(
          () => handleDealerRegister(body, trackingId),
          trackingId,
          startTime,
          corsHeaders
        );
      // Add other action handlers as needed
      default:
        return respondError(`Unknown action: ${action}`, 400, corsHeaders);
    }
  } catch (error) {
    // Handle unexpected errors
    logError("Unhandled exception in dealer-auth function", error);
    return respondError(
      `Internal server error: ${error.message}`,
      500,
      corsHeaders
    );
  }
});

// Process with exponential backoff retry for transient errors
async function processWithRetry(
  operation: () => Promise<Response>,
  requestId: string,
  startTime: number,
  corsHeaders: HeadersInit
): Promise<Response> {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      // Attempt the operation
      const result = await operation();
      
      // If successful and not an error response, return it
      if (result.status < 500) {
        if (retryCount > 0) {
          logInfo(`Request ${requestId} succeeded after ${retryCount} retries`);
        }
        return result;
      }
      
      // If we got a 5xx response, treat it as a retryable error
      const errorText = await result.text();
      throw new Error(`Server error: ${result.status} - ${errorText}`);
      
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || retryCount >= MAX_RETRIES) {
        // If not retryable or max retries reached, break the loop
        break;
      }
      
      // Calculate exponential backoff delay (with jitter)
      const baseDelay = 500; // 500ms base delay
      const maxDelay = 8000; // 8 second max delay
      const exponentialDelay = Math.min(
        maxDelay, 
        baseDelay * Math.pow(2, retryCount) * (0.5 + Math.random() * 0.5) // Add 50% jitter
      );
      
      logInfo(`Retrying request ${requestId} in ${exponentialDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, exponentialDelay));
      retryCount++;
    }
  }
  
  // If we get here, all retries failed
  const elapsedTime = Date.now() - startTime;
  logError(`Request ${requestId} failed after ${retryCount} retries in ${elapsedTime}ms`, lastError);
  
  // Return the error response
  return respondError(
    `Operation failed after ${retryCount} retries: ${lastError?.message || "Unknown error"}`,
    500,
    corsHeaders
  );
}

// Determine if an error is retryable
function isRetryableError(error: Error): boolean {
  const errorString = error.toString().toLowerCase();
  
  // Network-related errors are retryable
  if (
    errorString.includes("network") ||
    errorString.includes("connection") ||
    errorString.includes("timeout") ||
    errorString.includes("econnreset") ||
    errorString.includes("unavailable")
  ) {
    return true;
  }
  
  // Database transaction conflicts are retryable
  if (
    errorString.includes("deadlock") ||
    errorString.includes("lock timeout") ||
    errorString.includes("duplicate key") ||
    errorString.includes("serialization failure")
  ) {
    return true;
  }
  
  // Service unavailable or server errors are retryable
  if (
    errorString.includes("503") ||
    errorString.includes("500") ||
    errorString.includes("unexpected_failure") ||
    errorString.includes("internal server error")
  ) {
    return true;
  }
  
  return false;
}
